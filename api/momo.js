import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // =========================
    // 1. LẤY & CHUẨN HÓA DỮ LIỆU
    // =========================
    const amount = Math.round(Number(req.body.amount || 0));
    const orderId =
      String(req.body.orderId || `GSPRO_${Date.now()}`).trim();

    // ⚠️ DÙNG TEXT ĐƠN GIẢN ĐỂ TRÁNH LỖI ENCODE
    const orderInfo = "thanh toan test";

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount không hợp lệ" });
    }

    // =========================
    // 2. KEY SANDBOX MOMO
    // =========================
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "MomoTestSecretKey";

    const endpoint =
      "https://test-payment.momo.vn/v2/gateway/api/create";

    const redirectUrl =
      "https://giasupro.vercel.app/dashboard";
    const ipnUrl =
      "https://giasupro.vercel.app/api/momo-ipn";

    const requestType = "captureWallet";
    const extraData = "";
    const requestId = orderId;

    // =========================
    // 3. TẠO RAW SIGNATURE (CHUẨN 100%)
    // =========================
    const rawSignature =
      "accessKey=" +
      accessKey +
      "&amount=" +
      amount +
      "&extraData=" +
      extraData +
      "&ipnUrl=" +
      ipnUrl +
      "&orderId=" +
      orderId +
      "&orderInfo=" +
      orderInfo +
      "&partnerCode=" +
      partnerCode +
      "&redirectUrl=" +
      redirectUrl +
      "&requestId=" +
      requestId +
      "&requestType=" +
      requestType;

    // DEBUG (rất quan trọng nếu còn lỗi)
    console.log("RAW SIGNATURE:", rawSignature);

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    console.log("SIGNATURE:", signature);

    // =========================
    // 4. REQUEST BODY
    // =========================
    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    };

    // =========================
    // 5. GỌI MOMO API
    // =========================
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // =========================
    // 6. TRẢ KẾT QUẢ
    // =========================
    return res.status(200).json(data);
  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}