import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export async function GET(request, context) {
  try {
    const params = await (context.params || {});
    let name = params.name;

    if (!name) {
      const url = new URL(request.url);
      name = url.pathname.split("/").pop();
    }

    name = decodeURIComponent(name);

    const publicVideosDir = path.join(process.cwd(), "public", "videos");
    const outputDir = path.join(process.cwd(), "output");

    const targetPublicPath = path.join(publicVideosDir, name);
    const targetOutputPath = path.join(outputDir, name);

    let finalPath = targetPublicPath;
    if (!fs.existsSync(finalPath)) {
      if (fs.existsSync(targetOutputPath)) {
        finalPath = targetOutputPath;
      } else {
        return new Response("Video file not found on disk", { status: 404 });
      }
    }

    const range = request.headers.get("range");
    const fileBuffer = fs.readFileSync(finalPath);
    const fileSize = fileBuffer.length;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const slicedBuffer = fileBuffer.subarray(start, end + 1);
      
      return new NextResponse(slicedBuffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": "video/mp4",
        },
      });
    } else {
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
        },
      });
    }
  } catch (error) {
    console.error("Video stream route error:", error);
    return new Response(error.message, { status: 500 });
  }
}
