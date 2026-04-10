import { db } from "../../../../../Firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";

const TYPE_GROUPS = [
  [
    "Motivational",
    "Bonanza",
    "Welcome_Closing",
    "Good_Morning",
    "Health_Tips",
    "Achievements",
    "Achievements_B",
    "Anniversary_Birthday",
    "Devotional_Spiritual",
    "Leader_Quotes",
    "Income",
    "Meeting",
    "ThankYou_Birthday_Anniversary",
    "Capping",
  ],
];

export const fetchGeneralTemplates = async (groupIndex) => {
  try {
    const selectedTypes = TYPE_GROUPS[groupIndex];
    if (!selectedTypes) return [];

    const result = [];

    for (const type of selectedTypes) {
      const q = query(
        collection(db, "mlmtemplate"),
        where("MainType", "==", "General"),
        where("SelectType", "==", type),
        where("Active", "==", true),
        where("Launched", "==", true),
        orderBy("serial"),
        limit(4),
      );

      const snapshot = await getDocs(q);
      
      const templates = snapshot.docs.map((doc) => ({
        id: doc.id,
        image: doc.data().Showcase_url,
        type: doc.data().SelectType,
        Subtype: doc.data().Subtype,
        ShowCaseForm: doc.data().ShowCaseForm,
        serial: doc.data().serial,

      }));

      result.push({
        type,
        templates,
      });
    }

    return result;
  } catch (error) {
    console.error("General fetch error:", error);
    return [];
  }
};
