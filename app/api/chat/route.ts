import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = (body.message || "").toLowerCase();

    let reply = "";

    if (userMessage.includes("agni")) {
      reply =
        "Agni (अग्नि) is the central deity of Rigveda 1.1. He represents the sacred fire, the light, and the divine conduit between humans and the devas. Sāyaṇācārya defines Agni as 'अग्रणीर्भवति'—the one who leads. He is called the 'invoker' (hotā) who brings the gods to the sacrifice, and the 'bestower of treasures' (ratnadhātama).";
    } else if (
      userMessage.includes("rishi") ||
      userMessage.includes("composer") ||
      userMessage.includes("madhuchhandas")
    ) {
      reply =
        "The Rishi (composer/seer) of Rigveda 1.1 is Madhuchhandas Vaiśvāmitra (मधुच्छन्दस् वैश्वामित्र), a son of the legendary Sage Viśvāmitra. In the Vedic tradition, Rishis do not 'write' the texts but 'see' or perceive them through deep meditation.";
    } else if (userMessage.includes("meter") || userMessage.includes("chandas") || userMessage.includes("gayatri")) {
      reply =
        "All 9 mantras of Rigveda 1.1 are composed in the Gāyatrī meter (गायत्री छन्दस्). The Gāyatrī is a Vedic meter consisting of 24 syllables, structured as three padas (lines) of 8 syllables each (3 × 8 = 24). It is the most frequent meter in the Rigveda.";
    } else if (userMessage.includes("sayana") || userMessage.includes("commentary") || userMessage.includes("bhashya")) {
      reply =
        "Sāyaṇācārya (सायणाचार्य), who lived in the 14th century in the Vijayanagara Empire, wrote the 'Mādhavīya Vedārtha Prakāśa'—a monumental commentary (Bhāṣya) on the Rigveda. His commentary provides detailed word-by-word grammatical breakdowns (vyākaraṇa) and explains the ritual application (viniyoga) of each mantra.";
    } else if (userMessage.includes("rta") || userMessage.includes("rita") || userMessage.includes("cosmic order")) {
      reply =
        "Ṛta (ऋत) is the cosmic, moral, and natural order that sustains the universe in Vedic philosophy. In Rigveda 1.1.8, Agni is described as 'gopām ṛtasya dīdivim'—the shining guardian of Ṛta, showing that the sacred fire protects and illuminates the cosmic law.";
    } else if (userMessage.includes("purohita")) {
      reply =
        "Purohita (पुरोहित) is literally 'puras + hita'—placed foremost. It refers to the high priest or spiritual guide who represents the community before the divine. In Rigveda 1.1.1, Agni is described as the Purohita of the sacrifice, meaning he is the primary agent who initiates and protects the sacred ritual.";
    } else if (userMessage.includes("hotr") || userMessage.includes("hotar") || userMessage.includes("invoker")) {
      reply =
        "The Hotṛ (होता) is the priest responsible for reciting the verses of the Rigveda to summon (invoking) the gods hither. In Rigveda 1.1.1 and 1.1.5, Agni himself is praised as the ultimate Hotṛ because his divine voice and flames summon the devas to the sacrifice.";
    } else if (userMessage.includes("translation") || userMessage.includes("sachit")) {
      reply =
        "The fluid English translations provided in this digital library are prepared by Sachit Varshney under a Creative Commons Attribution-ShareAlike 4.0 International License (CC-BY-SA-4.0). They aim to capture the spiritual and grammatical essence of the Sanskrit text without archaic complexity.";
    } else if (userMessage.includes("mantra") || userMessage.includes("verses")) {
      reply =
        "This vertical slice contains the first 9 mantras of Mandala 1, Sukta 1 of the Rigveda Samhita. Each mantra is structured in the Gāyatrī meter, and they are all dedicated to the praise and invocation of Agni.";
    } else {
      reply =
        "That is a profound question. Sāyaṇācārya notes that Vedic terms carry multi-layered meanings: grammatical (adhibhūta), ritual (adhijajña), and spiritual (adhyātma). How can I assist you further with the text, the grammar matrix, or the commentaries of Rigveda 1.1?";
    }

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process the request" },
      { status: 500 }
    );
  }
}
