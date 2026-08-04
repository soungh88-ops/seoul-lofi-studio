const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

class YouTubeHelper {
  constructor() {
    const os = require("os");
    const tokenDir = process.env.VERCEL ? os.tmpdir() : process.cwd();
    this.tokenPath = path.join(tokenDir, "tokens.json");
    this.oauth2Client = null;
    this.initializeOAuthClient();
  }

  /**
   * Initializes the OAuth2 client using credentials in .env.local
   */
  initializeOAuthClient() {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

    if (
      clientId &&
      clientId !== "your_youtube_client_id_here" &&
      clientSecret &&
      clientSecret !== "your_youtube_client_secret_here"
    ) {
      this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      this.loadTokens();
    } else {
      console.warn("YouTube OAuth credentials not fully configured in .env.local");
      this.oauth2Client = null;
    }
  }

  /**
   * Checks if OAuth client is ready to authenticate/upload
   */
  isConfigured() {
    return this.oauth2Client !== null;
  }

  /**
   * Generates the Google OAuth2 authorization URL
   */
  getAuthUrl() {
    if (!this.isConfigured()) {
      throw new Error("YouTube OAuth credentials are not configured in .env.local");
    }
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline", // Essential to get refresh_token
      scope: ["https://www.googleapis.com/auth/youtube.upload"],
      prompt: "consent select_account" // Force account/channel selector screen
    });
  }

  /**
   * Exchanges authorization code for tokens and saves them
   */
  async handleCallback(code) {
    if (!this.isConfigured()) {
      throw new Error("OAuth client not initialized");
    }
    const { tokens } = await this.oauth2Client.getToken(code);
    this.saveTokens(tokens);
    return tokens;
  }

  /**
   * Saves tokens to tokens.json
   */
  saveTokens(tokens) {
    this.oauth2Client.setCredentials(tokens);
    
    // Merge new tokens with existing ones to avoid losing refresh_token
    let existingTokens = {};
    try {
      if (fs.existsSync(this.tokenPath)) {
        try {
          existingTokens = JSON.parse(fs.readFileSync(this.tokenPath, "utf-8"));
        } catch (e) {
          existingTokens = {};
        }
      }
      
      const mergedTokens = { ...existingTokens, ...tokens };
      fs.writeFileSync(this.tokenPath, JSON.stringify(mergedTokens, null, 2), "utf-8");
    } catch (fsErr) {
      console.warn("Vercel FS restriction: Cannot save tokens to disk.");
    }
  }

  /**
   * Loads saved tokens from tokens.json
   */
  loadTokens() {
    try {
      if (fs.existsSync(this.tokenPath)) {
        try {
          const tokens = JSON.parse(fs.readFileSync(this.tokenPath, "utf-8"));
          this.oauth2Client.setCredentials(tokens);
        } catch (e) {
          console.error("Failed to parse saved tokens:", e);
        }
      }
    } catch (fsErr) {
      console.warn("Vercel FS restriction: Cannot read tokens from disk.");
    }
  }

  /**
   * Checks if user is authenticated (tokens exist and are loaded)
   */
  isAuthenticated() {
    if (!this.isConfigured()) return false;
    const credentials = this.oauth2Client.credentials;
    return credentials && (credentials.access_token || credentials.refresh_token);
  }

  /**
   * Performs resumable chunked video upload to YouTube
   */
  async uploadVideo({
    videoPath,
    title,
    description,
    tags = [],
    privacyStatus = "private", // Default to private for review
    thumbnailPath,
    publishAt,
    onProgress // callback(percentage)
  }) {
    if (!this.isAuthenticated()) {
      throw new Error("User is not authenticated. Connect YouTube account first.");
    }

    const fileSize = fs.statSync(videoPath).size;
    const youtube = google.youtube({
      version: "v3",
      auth: this.oauth2Client
    });

    const response = await youtube.videos.insert(
      {
        part: "id,snippet,status",
        notifySubscribers: false,
        requestBody: {
          snippet: {
            title: title.substring(0, 100), // Max 100 chars
            description: description,
            tags: tags,
            categoryId: "10", // Music category
            defaultLanguage: "en"
          },
          status: {
            privacyStatus: publishAt ? "private" : privacyStatus,
            selfDeclaredMadeForKids: false,
            ...(publishAt ? { publishAt } : {})
          }
        },
        media: {
          body: fs.createReadStream(videoPath)
        }
      },
      {
        // Resumable upload configuration
        onUploadProgress: (evt) => {
          const progress = Math.round((evt.bytesRead / fileSize) * 100);
          onProgress(progress);
        }
      }
    );

    // If thumbnailPath is provided and exists, upload the thumbnail for the video
    if (thumbnailPath && fs.existsSync(thumbnailPath) && response.data && response.data.id) {
      try {
        await youtube.thumbnails.set({
          videoId: response.data.id,
          media: {
            body: fs.createReadStream(thumbnailPath)
          }
        });
      } catch (thumbError) {
        console.warn("Failed to set video thumbnail:", thumbError);
      }
    }

    return response.data;
  }
}

module.exports = new YouTubeHelper();
