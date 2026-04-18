import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConsultationsService } from '../consultations/consultations.service';

@Injectable()
export class ExtractionService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    private consultationsService: ConsultationsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  private readonly MEDICAL_SCHEMA = `{
  "identificacion": {
    "tipo_tramite": "Programación de cirugía / Tratamiento médico / Auxiliar diagnóstico / Reembolso",
    "fecha_solicitud": "DD/MM/AAAA",
    "empresa": "string",
    "id_numero": "string",
    "nombre_titular": "string",
    "nombre_afectado": "string",
    "fecha_nacimiento": "DD/MM/AAAA",
    "edad": "number",
    "sexo": "F / M",
    "estado_civil": "string",
    "telefonos": "string"
  },
  "historia_clinica": {
    "causa_atencion": "Embarazo / Enfermedad / Accidente",
    "antecedentes": "string",
    "padecimiento_actual": "string",
    "fecha_inicio_sintomas": "DD/MM/AAAA",
    "signos_vitales": { "peso_kg": "number", "ta_mmhg": "string", "talla_cm": "number" },
    "diagnostico_cie10": "string",
    "fecha_diagnostico": "DD/MM/AAAA",
    "tipo_congenito_adquirido": "Congénito / Adquirido",
    "tipo_agudo_cronico": "Agudo / Crónico",
    "resultados_exploracion_estudios": "string",
    "tratamiento_cpt": "string"
  },
  "hospitalizacion": {
    "complicaciones": "boolean",
    "desc_complicaciones_obs": "string",
    "datos_hospital": { "nombre": "string", "ciudad": "string", "estado": "string" },
    "fechas_ingreso_egreso": "string",
    "tipo_estancia": "Hospitalización / Urgencia / Corta estancia / Ambulatoria",
    "medico_tratante": { "nombre": "string", "especialidad": "string", "cedula": "string", "red": "boolean" },
    "honorarios": "string"
  }
}`;

  // PROBLEMA 1: Extrae datos de transcripción de consulta médica
  async extractFromTranscription(transcriptionText: string, patientId?: string) {
    const prompt = `
Actúa como un transcriptor médico de alta precisión. Tu tarea es extraer información de una conversación y devolverla únicamente en formato JSON siguiendo el esquema proporcionado.

Instrucciones de llenado:
- Si la información no se menciona explícitamente o tienes dudas, pon null.
- PRIORIDAD CRÍTICA: Si existe una contradicción entre la información etiquetada como [Voz] y la etiquetada como [Nota], dale prioridad absoluta a la información de [Voz].
- Para campos de Opción Múltiple, selecciona solo una de las opciones dadas. Si el médico dice algo parecido pero no igual, normalízalo a la opción válida.
- En Signos Vitales, extrae solo los números.
- En Diagnóstico, intenta añadir el código CIE-10 si el médico menciona la enfermedad.
- Omite campos que sean null para que el JSON sea más limpio.

Esquema JSON a seguir:
${this.MEDICAL_SCHEMA}

TRANSCRIPCIÓN DE LA CONSULTA:
${transcriptionText}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin backticks, sin comentarios.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      const clean = text.replace(/```json|```/g, '').trim();
      const extracted = JSON.parse(clean);

      if (patientId) {
        await this.consultationsService.saveExtractionResult(patientId, extracted, 'transcription');
      }

      return extracted;
    } catch (error) {
      throw new BadRequestException(
        'Error al procesar la transcripción: ' + error.message,
      );
    }
  }

  // PROBLEMA 2: Extrae datos de documento de identidad (INE, CURP, Acta)
  async extractFromDocument(base64Image: string, mimeType: string = 'image/jpeg', patientId?: string) {
    const prompt = `
Eres un asistente especializado en extraer información de documentos oficiales mexicanos (INE, CURP, Acta de Nacimiento).
Extrae los datos visibles y llénalos en el siguiente esquema JSON.
Si un dato no es visible o no aplica, usa null.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin backticks:
{
  "nombre": null,
  "apellido_paterno": null,
  "apellido_materno": null,
  "fecha_nacimiento": null,
  "sexo": "F / M",
  "curp": null,
  "clave_elector": null,
  "domicilio": null,
  "municipio": null,
  "estado": null,
  "nacionalidad": null,
  "tipo_documento": "INE / CURP / ACTA_NACIMIENTO / OTRO"
}
    `;

    try {
      const result = await this.model.generateContent([
        prompt,
        { inlineData: { mimeType, data: base64Image } },
      ]);
      const text = result.response.text().trim();
      const clean = text.replace(/```json|```/g, '').trim();
      const extracted = JSON.parse(clean);

      if (patientId) {
        await this.consultationsService.saveExtractionResult(patientId, extracted, 'document');
      }

      return extracted;
    } catch (error) {
      throw new BadRequestException(
        'Error al procesar el documento: ' + error.message,
      );
    }
  }

  // Pule la transcripción cruda que contiene repeticiones
  async polishTranscription(rawText: string): Promise<string> {
    const prompt = `
Eres un asistente médico experto. A continuación te presentaré una transcripción en crudo (con partes repetidas, traslapadas o marcas como [Voz] y [Nota] porque se generó en tiempo real). 
Tu tarea es limpiarla, eliminar todas las repeticiones y entregar un solo texto fluido, coherente y fácil de leer, manteniendo absolutamente toda la información médica, datos del paciente y notas originales, y sin inventar datos.

TRANSCRIPCIÓN EN CRUDO:
${rawText}

Responde ÚNICAMENTE con el texto limpio y pulido, sin formato adicional, comentarios ni introducciones.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Error al pulir la transcripción', error);
      return rawText; // Retorna el texto original si falla
    }
  }
}