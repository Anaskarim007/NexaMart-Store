import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFICATION_EMAIL = "nexamart10@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { orderNumber } = await req.json();

    if (!orderNumber) {
      return new Response(
        JSON.stringify({ error: "Missing order number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch order details by order_number
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if email was already sent for this order (prevent duplicates)
    const { data: existingNotif } = await supabase
      .from("email_notifications")
      .select("id, email_sent")
      .eq("order_id", order.id)
      .maybeSingle();

    if (existingNotif?.email_sent) {
      return new Response(
        JSON.stringify({ success: true, message: "Email already sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at");

    if (itemsError) {
      throw new Error("Failed to fetch order items");
    }

    // Build email HTML
    const itemsHtml = (items ?? [])
      .map(
        (item: { product_name: string; quantity: number; product_price: number; line_total: number }) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.product_name}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">Rs. ${Number(item.product_price).toLocaleString()}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">Rs. ${Number(item.line_total).toLocaleString()}</td>
        </tr>`,
      )
      .join("");

    const orderDate = new Date(order.created_at).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #eee;">
        <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 400; letter-spacing: 2px; margin: 0;">NEXAMART</h1>
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 4px;">New Order Notification</p>
      </div>

      <div style="padding: 24px 0;">
        <h2 style="font-size: 20px; font-weight: 400;">Order #${order.order_number}</h2>
        <p style="color: #666; font-size: 14px;">${orderDate}</p>

        <table style="width: 100%; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888; width: 40%;">Customer Name</td>
            <td style="padding: 4px 0;">${order.customer_name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Email</td>
            <td style="padding: 4px 0;">${order.customer_email}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Phone</td>
            <td style="padding: 4px 0;">${order.customer_phone}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888; vertical-align: top;">Address</td>
            <td style="padding: 4px 0;">${order.shipping_address}, ${order.shipping_city}, ${order.shipping_postal_code}, ${order.shipping_country}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Payment Method</td>
            <td style="padding: 4px 0;">${order.payment_method}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Order Status</td>
            <td style="padding: 4px 0; text-transform: capitalize;">${order.status}</td>
          </tr>
        </table>

        <h3 style="font-size: 16px; font-weight: 500; margin-top: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Order Items</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr style="text-align: left; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
            <th style="padding: 8px 0;">Product</th>
            <th style="padding: 8px 0; text-align: center;">Qty</th>
            <th style="padding: 8px 0; text-align: right;">Price</th>
            <th style="padding: 8px 0; text-align: right;">Total</th>
          </tr>
          ${itemsHtml}
        </table>

        <table style="width: 100%; margin-top: 16px; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right;">Rs. ${Number(order.subtotal).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Shipping</td>
            <td style="padding: 4px 0; text-align: right;">${Number(order.shipping_cost) === 0 ? "Free Delivery" : `Rs. ${Number(order.shipping_cost).toLocaleString()}`}</td>
          </tr>
          <tr style="border-top: 2px solid #1a1a1a;">
            <td style="padding: 12px 0; font-weight: 600; font-size: 16px;">Total</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 16px;">Rs. ${Number(order.total).toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; padding: 24px 0; border-top: 1px solid #eee; color: #888; font-size: 12px;">
        <p>This is an automated notification from Nexamart.</p>
      </div>
    </div>`;

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NexaMart <onboarding@resend.dev>",
        to: [NOTIFICATION_EMAIL],
        subject: `New NexaMart Order - #${order.order_number}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorBody = await emailResponse.text();
      console.error("Email sending failed:", emailResponse.status, errorBody);

      if (existingNotif) {
        await supabase
          .from("email_notifications")
          .update({ email_sent: false, error_message: errorBody })
          .eq("id", existingNotif.id);
      } else {
        await supabase.from("email_notifications").insert({
          order_id: order.id,
          email_sent: false,
          error_message: errorBody,
        });
      }

      return new Response(
        JSON.stringify({ success: false, error: "Email sending failed", detail: errorBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Record successful email
    if (existingNotif) {
      await supabase
        .from("email_notifications")
        .update({ email_sent: true, sent_at: new Date().toISOString(), error_message: null })
        .eq("id", existingNotif.id);
    } else {
      await supabase.from("email_notifications").insert({
        order_id: order.id,
        email_sent: true,
        sent_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
