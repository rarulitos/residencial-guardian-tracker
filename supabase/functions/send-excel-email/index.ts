import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

// --- INSTRUCCIONES IMPORTANTES ---
// 1. Asegúrate de haber guardado tu API Key de Resend como un "secret" en Supabase:
//    supabase secrets set RESEND_API_KEY="TU_CLAVE_REAL_DE_RESEND"
//
// 2. Debes tener un dominio verificado en tu cuenta de Resend (ej: "mi-empresa.com").
//
// 3. La dirección de correo en el campo `from` de abajo DEBE usar tu dominio verificado.
// ---

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificamos que la API Key esté configurada
    if (!RESEND_API_KEY) {
      throw new Error("La variable RESEND_API_KEY no está configurada en los secrets de Supabase.");
    }
    const resend = new Resend(RESEND_API_KEY);

    const { to, subject, body, attachment } = await req.json();

    if (!to || !subject || !body || !attachment) {
      return new Response(JSON.stringify({ error: "Faltan parámetros requeridos en la solicitud." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- !!! EDITA ESTA LÍNEA !!! ---
    // Reemplaza 'tudominio.com' con el dominio que TÚ verificaste en Resend.
    const fromEmail = "Residencial Don Hugo <facturas@facturas.raulcerda.cl>";

    console.log(`Intentando enviar correo desde: ${fromEmail} hacia: ${to}`);

    const emailOptions: any = {
      from: fromEmail,
      to: [to],
      subject: subject,
      html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      text: body,
    };

    if (attachment) {
      emailOptions.attachments = [
        {
          filename: "ReporteHospedaje.xlsx",
          content: attachment,
        },
      ];
    }

    const { data, error } = await resend.emails.send(emailOptions);

    // Si Resend devuelve un error, lo registraremos en detalle
    if (error) {
      console.error("Error recibido desde Resend:", JSON.stringify(error, null, 2));
      return new Response(JSON.stringify({ message: "Resend no pudo enviar el correo.", details: error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Correo enviado exitosamente:", JSON.stringify(data, null, 2));
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error crítico en la Edge Function:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Para desarrollo local, puedes usar `supabase functions serve`
// y luego llamar a la función con una herramienta como curl o Postman.
// Ejemplo de curl:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/send-excel-email' \
// --header 'Authorization: Bearer TU_SUPABASE_ANON_KEY' \
// --header 'Content-Type: application/json' \
// --data '{
//   "to": "destinatario@ejemplo.com",
//   "subject": "Asunto de prueba",
//   "body": "Este es el cuerpo del mensaje.",
//   "attachment": "BASE64_ENCODED_STRING_AQUI"
// }'\
//
// Recuerda reemplazar TU_SUPABASE_ANON_KEY con tu clave real.
// La clave de servicio (service_role) también funciona.
// El `attachment` es una cadena de texto larga en base64.
// Puedes usar un conversor online para generar una a partir de un archivo de prueba.