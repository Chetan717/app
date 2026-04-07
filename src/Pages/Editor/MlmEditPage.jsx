import React, { useState, useEffect } from "react";
import { Stage, Layer, Text, Circle, Image, Rect } from "react-konva";
import useImage from "use-image";
import ListOfTemplates from "./components/ListOfTemplates";

const STAGE_WIDTH = 320;
const STAGE_HEIGHT = 320;
const HEADER_FOOTER_HEIGHT = 50;
const EXPORT_PIXEL_RATIO = 6;

export const GENERAL_SELECT_TYPES = [
  { name: "Trending", value: "Trending" },
  { name: "Festival", value: "Festival" },
  { name: "Motivational", value: "Motivational" },
  { name: "Good Morning", value: "Good_Morning" },
  { name: "Devotional / Spiritual", value: "Devotional_Spiritual" },
  { name: "Leader Quotes", value: "Leader_Quotes" },
  { name: "Health Tips", value: "Health_Tips" },
  // { name: "Bonanza", value: "Bonanza" },
  // { name: "Achievements", value: "Achievements" },
  // { name: "Achievements B", value: "Achievements_B" },
  // { name: "Income", value: "Income" },
  // { name: "Welcome / Closing", value: "Welcome_Closing" },
  // { name: "Meeting", value: "Meeting" },
  { name: "Anniversary & Birthday", value: "Anniversary_Birthday" },
  { name: "Greeting & Wishes", value: "Greeting_Wishes" },
  {
    name: "Thank You (Birthday & Anniversary)",
    value: "ThankYou_Birthday_Anniversary",
  },
  // { name: "Capping", value: "Capping" },
];

function MlmEditPage() {
  const stageRef = React.useRef(null);
  const TemplatePosition = true;

  const [mlmForm, setMlmForm] = useState(null);
  const [mlmProfile, setMlmProfile] = useState(null);
  const [selected, setSelected] = useState(null);

  function getSelType() {
    try {
      return JSON.parse(localStorage.getItem("selType")) || {};
    } catch {
      return {};
    }
  }

  useEffect(() => {
    const formData = localStorage.getItem("mlmform");
    const profileData = localStorage.getItem("mlmProfile");
    if (formData) setMlmForm(JSON.parse(formData));
    if (profileData) setMlmProfile(JSON.parse(profileData));
  }, []);

  const selll = getSelType();
  const achiever = mlmForm?.achiever || {};
  const tab = mlmForm?.tab || "team";
  const topuplineURLs = mlmProfile?.topuplineURLs || [];
  const profileName = mlmForm?.promoter?.name
    ? mlmForm?.promoter?.name
    : mlmProfile?.fullName || "";
  const profileMobile = mlmForm?.promoter?.name
    ? mlmForm?.promoter?.mobile
    : mlmProfile?.mobile || "";
  const designation = mlmForm?.promoter?.name
    ? mlmForm?.promoter?.role
    : mlmProfile?.designation;

  // ── Hide achiever name/city for general template types ────────────
  const isGeneralType = GENERAL_SELECT_TYPES.some(
    (t) => t.value === selll?.type,
  );

  const [bgImage] = useImage(`${selected?.url || ""}`, "anonymous");
  const [Imagefooter] = useImage(
    "https://firebasestorage.googleapis.com/v0/b/mlmbooster.firebasestorage.app/o/graphics%2Flinks%2F1775306097021_qqhdl6.webp?alt=media&token=54d461df-8c6a-459d-be1d-505e7471ba50",
    "anonymous",
  );
  const [Imaget1] = useImage(
    "https://firebasestorage.googleapis.com/v0/b/mlmbooster.firebasestorage.app/o/graphics%2Flinks%2F1775306087385_281aww.webp?alt=media&token=9fd57ab6-07f3-4a1a-a4df-8c35a9224c46",
    "anonymous",
  );

  const [Imagel2] = useImage(mlmProfile?.logoURLs?.[0] || "", "anonymous");
  const [Imagel3] = useImage(mlmProfile?.logoURLs?.[1] || "", "anonymous");
  const [Imagel4] = useImage(mlmProfile?.logoURLs?.[2] || "", "anonymous");

  const [Imagetop1] = useImage(topuplineURLs?.[0] || "", "anonymous");
  const [Imagetop2] = useImage(topuplineURLs?.[1] || "", "anonymous");
  const [Imagetop3] = useImage(topuplineURLs?.[2] || "", "anonymous");
  const [Imagetop4] = useImage(topuplineURLs?.[3] || "", "anonymous");

  const [ImageProfile] = useImage(
    mlmForm?.promoter?.name
      ? `${mlmForm?.promoter?.image}`
      : `${mlmProfile?.profileImageURLs[0]}`,
    "anonymous",
  );

  const downloadURI = (uri, name) => {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL({
      pixelRatio: EXPORT_PIXEL_RATIO,
      mimeType: "image/png",
      quality: 1,
    });
    downloadURI(uri, "stage-hd.png");
  };

  const ActualProfilename = profileName?.toUpperCase() || "PROFILENAME";
  const ActualDesignation = designation?.toUpperCase() || "DESIGNATION";

  let ProfilefontSize = 9;

  if (ActualProfilename?.length > 10 && ActualProfilename?.length <= 19) {
    ProfilefontSize = 7;
  } else if (ActualProfilename?.length > 19) {
    ProfilefontSize = 5;
  }

  let DesignationfontSize = 7;

  if (ActualDesignation?.length > 10 && ActualDesignation?.length <= 19) {
    DesignationfontSize = 5;
  } else if (ActualDesignation?.length > 19) {
    DesignationfontSize = 4;
  }
  return (
    <div className="flex flex-col justify-start items-center h-screen">
      <Stage
        ref={stageRef}
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        className="bg-slate-100 mt-2 shadow-lg"
      >
        <Layer>
          <Image
            image={bgImage}
            x={0}
            y={0}
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
          />

          <Image image={Imagel2} x={3} y={2} width={25} height={25} />
          <Image image={Imagel3} x={260} y={2} width={25} height={25} />
          <Image image={Imagel4} x={290} y={2} width={25} height={25} />

          <Image image={Imagetop1} x={100} y={2} width={25} height={25} />
          <Image image={Imagetop2} x={130} y={2} width={25} height={25} />
          <Image image={Imagetop3} x={160} y={2} width={25} height={25} />
          <Image image={Imagetop4} x={190} y={2} width={25} height={25} />

          {isGeneralType ? null : (
            <Image image={Imagefooter} x={0} y={280} width={350} height={41} />
          )}

          {selected?.position === "right" ? (
            <>
              {/* Achiever name/city hidden for general types */}
              {!isGeneralType && (
                <>
                  <Text
                    x={55}
                    y={87}
                    width={150}
                    height={20}
                    text={achiever.name || "Chaitnya Chaudhari"}
                    fontSize={12}
                    fill="white"
                    fontStyle="bold"
                    verticalAlign="middle"
                  />
                  <Text
                    x={99}
                    y={106}
                    width={100}
                    height={20}
                    text={achiever.city || "Pune"}
                    fontSize={10}
                    fill="white"
                    fontStyle="bold"
                    verticalAlign="middle"
                  />
                </>
              )}

              <Text
                x={43}
                y={294}
                width={150}
                height={5}
                text="CALL FOR ASSOCIATION"
                fontSize={7}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              />
              <Text
                x={39}
                y={296}
                width={150}
                height={20}
                text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                fontSize={12}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              />
              <Text
                x={160}
                y={287}
                width={120}
                height={20}
                text={ActualProfilename}
                fontSize={ProfilefontSize}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              />
              <Text
                x={145}
                y={303}
                width={110}
                height={5}
                text={ActualDesignation}
                fontSize={DesignationfontSize}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              />
              {/* <Text
                x={150}
                y={308}
                width={110}
                height={10}
                text="social"
                fontSize={8}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              /> */}

              {isGeneralType ? (
                <Image
                  image={ImageProfile}
                  x={-1}
                  y={55}
                  width={180}
                  height={230}
                />
              ) : (
                <Image
                  image={ImageProfile}
                  x={231}
                  y={220}
                  width={100}
                  height={100}
                />
              )}
            </>
          ) : (
            <>
              {/* Achiever name/city hidden for general types */}
              {!isGeneralType && (
                <>
                  <Text
                    x={180}
                    y={87}
                    width={150}
                    height={20}
                    text={achiever.name || "Chaitnya Chaudhari"}
                    fontSize={12}
                    fill="white"
                    fontStyle="bold"
                    verticalAlign="middle"
                  />
                  <Text
                    x={190}
                    y={106}
                    width={100}
                    height={20}
                    text={achiever.city || "Pune"}
                    fontSize={10}
                    fill="white"
                    fontStyle="bold"
                    verticalAlign="middle"
                  />
                </>
              )}

              <Text
                x={43}
                y={294}
                width={150}
                height={5}
                text="CALL FOR ASSOCIATION"
                fontSize={7}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              />
              <Text
                x={39}
                y={296}
                width={150}
                height={20}
                text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                fontSize={12}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              />
              <Text
                x={140}
                y={286}
                width={100}
                height={20}
                text={ActualProfilename}
                fontSize={ProfilefontSize}
                fill="white"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
              />
              <Text
                x={145}
                y={303}
                width={100}
                height={5}
                text={ActualDesignation}
                fontSize={DesignationfontSize}
                fill="white"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
              />
              {/* <Text
                x={150}
                y={308}
                width={110}
                height={10}
                text="social"
                fontSize={8}
                fill="white"
                fontStyle="bold"
                verticalAlign="middle"
              /> */}

              {isGeneralType ? (
                <Image
                  image={ImageProfile}
                  x={140}
                  y={55}
                  width={180}
                  height={230}
                />
              ) : (
                <Image
                  image={ImageProfile}
                  x={231}
                  y={220}
                  width={100}
                  height={100}
                />
              )}
            </>
          )}

          {isGeneralType ? (
            <Image image={Imagefooter} x={0} y={280} width={350} height={41} />
          ) : null}
        </Layer>
      </Stage>
      <ListOfTemplates selected={selected} setSelected={setSelected} />
    </div>
  );
}

export default MlmEditPage;
