import fs from "fs";
import path from "path";

export async function GET(request, context) {
  try {
    // Resolve params robustly for all Next.js App Router versions
    const params = await (context.params || {});
    let name = params.name;

    if (!name) {
      const url = new URL(request.url);
      name = url.pathname.split("/").pop();
    }

    name = decodeURIComponent(name);
    const videoPath = path.join(process.cwd(), "output", name);

    if (!fs.existsSync(videoPath)) {
      return new Response("Video not found", { status: 404 });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    // Support HTTP range requests for smooth HTML5 video seeking
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      // Read chunk buffer for 100% Web API Response compatibility
      const fd = fs.openSync(videoPath, "r");
      const buffer = Buffer.alloc(chunkSize);
      fs.readSync(fd, buffer, 0, chunkSize, start);
      fs.closeSync(fd);

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4"
      };

      return new Response(buffer, {
        status: 206,
        headers
      });
    } else {
      const buffer = fs.readFileSync(videoPath);
      const headers = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4"
      };

      return new Response(buffer, {
        status: 200,
        headers
      });
    }
  } catch (error) {
    console.error("Video stream route error:", error);
    return new Response(error.message, { status: 500 });
  }
}
