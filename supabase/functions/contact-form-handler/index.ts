// supabase/functions/contact-form-handler/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers. Adjust 'Access-Control-Allow-Origin' for production.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // IMPORTANT: For production, replace '*' with your website's domain
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Ensure the request method is POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    const { name, email, subject, message } = await req.json();

    // Basic server-side validation
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields: name, email, subject, and message are required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Supabase client with service_role key for backend operations
    // Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set as environment variables in your Supabase project settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error("CONTACT-FORM-HANDLER: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set.");
        return new Response(JSON.stringify({ error: "Server configuration error. Cannot process request." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Prepare data for insertion
    const submissionData = {
      name: name,
      email: email,
      subject: subject,
      message: message,
      // Optional: Capture IP address (consider privacy implications)
      // ip_address: req.headers.get("x-forwarded-for")?.split(',')[0].trim() || req.headers.get("cf-connecting-ip") || // Common headers for IP
    };

    console.log("CONTACT-FORM-HANDLER: Attempting to insert submission:", submissionData);

    // Insert data into the 'contact_submissions' table
    const { data, error } = await supabaseAdmin
      .from("contact_submissions") // Use your actual table name
      .insert([submissionData])
      .select(); // .select() can be useful to confirm the insert or get the inserted row

    if (error) {
      console.error("CONTACT-FORM-HANDLER: Error inserting data into Supabase:", error);
      return new Response(JSON.stringify({ error: "Failed to store submission. " + error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("CONTACT-FORM-HANDLER: Submission stored successfully. Inserted data:", data);

    // You could still send an email notification here if desired,
    // using the email sending logic from the previous version.

    return new Response(JSON.stringify({ success: true, message: "Thank you for your message! It has been received." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("CONTACT-FORM-HANDLER: Unhandled error processing request:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected server error occurred." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});