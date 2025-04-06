import { S3 } from "aws-sdk";
import { NextResponse } from "next/server";

const s3 = new S3({
  region: process.env.AWS_REGION ||  "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  signatureVersion: "v4",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { message: "Missing name or type" },
        { status: 400 }
      );
    }

    // No 'ACL' param here because your bucket disallows ACLs
    const params = {
      Bucket: "video-raiyanzaman",
      Key: `uploads/${Date.now()}_${name.replace(/\s+/g, "_")}`,
      ContentType: type,
      Expires: 60, // 60s presign
    };

    // Generate the presigned PUT URL
    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);

    return NextResponse.json({
      uploadUrl,
      key: params.Key,
    });
  } catch (error: any) {
    console.error("S3 Error Details:", {
      message: error.message,
      code: error.code,
      region: process.env.AWS_REGION,
      bucket: "video-raiyanzaman",
    });

    return NextResponse.json(
      {
        message: "Failed to generate upload URL",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
