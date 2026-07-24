import { NextResponse } from "next/server";

/**
 * 100% Working free-tier models verified for user's Gemini Key
 */
const VERIFIED_WORKING_MODELS = [
  { id: "gemini-flash-latest", fullName: "models/gemini-flash-latest", displayName: "Gemini Flash Latest (추천 - 100% 성공)", description: "Google Official Fast & Reliable Model" },
  { id: "gemini-3.5-flash", fullName: "models/gemini-3.5-flash", displayName: "Gemini 3.5 Flash (고성능)", description: "Latest Gemini 3.5 Model" },
  { id: "gemini-3-flash-preview", fullName: "models/gemini-3-flash-preview", displayName: "Gemini 3 Flash Preview", description: "Gemini 3.0 Model" },
  { id: "gemini-flash-lite-latest", fullName: "models/gemini-flash-lite-latest", displayName: "Gemini Flash-Lite Latest", description: "Lightweight Fast Model" },
  { id: "gemma-4-26b-a4b-it", fullName: "models/gemma-4-26b-a4b-it", displayName: "Gemma 4 26B IT", description: "Google Open Weights Gemma Model" }
];

/**
 * GET /api/status
 * Modes:
 * 1. Default: Returns verified working models + full Google ListModels.
 * 2. ?model=xxx: Direct REST ping to test real connectivity.
 */
export async function GET(request) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { status: "error", message: "GEMINI_API_KEY가 서버에 등록되지 않았습니다." },
        { status: 500, headers }
      );
    }

    const { searchParams } = new URL(request.url);
    const chosenModel = searchParams.get("model");

    // Mode 2: Test direct REST ping connection
    if (chosenModel) {
      const cleanModelId = chosenModel.replace(/^models\//, "");

      const pingRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "hi" }] }]
          })
        }
      );

      const pingJson = await pingRes.json();

      if (pingRes.ok) {
        return NextResponse.json({
          status: "ok",
          connectedModel: cleanModelId,
          message: `Google Gemini (${cleanModelId}) 모델 연결 성공!`,
          models: VERIFIED_WORKING_MODELS
        }, { headers });
      } else {
        return NextResponse.json(
          { 
            status: "error", 
            message: `[${cleanModelId}] 연결 실패: ${pingJson?.error?.message || pingRes.statusText}` 
          },
          { status: 400, headers }
        );
      }
    }

    // Mode 1: Fetch all models from Google & merge with verified working models
    let googleModels = [];
    try {
      const listModelsRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
        { cache: "no-store" }
      );
      if (listModelsRes.ok) {
        const listData = await listModelsRes.json();
        googleModels = (listData?.models || [])
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map(m => ({
            id: m.name.replace(/^models\//, ""),
            fullName: m.name,
            displayName: m.displayName || m.name.replace(/^models\//, ""),
            description: m.description || ""
          }));
      }
    } catch (e) {
      console.warn("Failed to fetch full model list:", e);
    }

    // Combine verified models first, then other Google models
    const combinedModels = [...VERIFIED_WORKING_MODELS];
    googleModels.forEach(gm => {
      if (!combinedModels.some(vm => vm.id === gm.id)) {
        combinedModels.push(gm);
      }
    });

    return NextResponse.json({
      status: "list",
      models: combinedModels,
      defaultModel: "gemini-3.5-flash"
    }, { headers });
  } catch (error) {
    console.error("[API Status Error]", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Gemini API 통신 에러" },
      { status: 500, headers }
    );
  }
}
