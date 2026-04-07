import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Text, Image, Transformer } from "react-konva";
import useImage from "use-image";
import ListOfTemplates from "./components/ListOfTemplates";
import TopuplineSelect from "./utils/TopuplineSelect";
import { Button } from "@heroui/react";

const STAGE_WIDTH = 320;
const STAGE_HEIGHT = 320;
const EXPORT_PIXEL_RATIO = 6;

export const GENERAL_SELECT_TYPES = [
  //   { name: "Trending", value: "Trending" },
  //   { name: "Festival", value: "Festival" },
  { name: "Motivational", value: "Motivational" },
  //   { name: "Good Morning", value: "Good_Morning" },
  //   { name: "Devotional / Spiritual", value: "Devotional_Spiritual" },
  //   { name: "Leader Quotes", value: "Leader_Quotes" },
  //   { name: "Health Tips", value: "Health_Tips" },
  { name: "Anniversary & Birthday", value: "Anniversary_Birthday" },
  { name: "Greeting & Wishes", value: "Greeting_Wishes" },
  {
    name: "Thank You (Birthday & Anniversary)",
    value: "ThankYou_Birthday_Anniversary",
  },
];

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function GeneralEditPage({ graphicsMap }) {
  const stageRef = useRef(null);
  const profileImageRef = useRef(null);
  const transformerRef = useRef(null);
  const stageContainerRef = useRef(null);

  const frames = graphicsMap?.["TopUplineFrames"]?.[0]?.GraphicsLinks || [];

  const [mlmForm, setMlmForm] = useState(null);
  const [mlmProfile, setMlmProfile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedTopFrame, setSelectedTopFrame] = useState(frames[0] || null);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileSelected, setIsProfileSelected] = useState(false);

  // Toolbar position over the canvas (in px relative to stage container)
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, width: 0 });
  const isRight = selected?.position === "right";
  const selll = getSelType();
  const isSubGeneralType = GENERAL_SELECT_TYPES.some(
    (t) => t.value === selll?.type,
  );
  const [profileAttrs, setProfileAttrs] = useState({
    x: isRight ? -1 : 140,
    y: 55,
    width: 180,
    height: 230,
    scaleX: 1,
    offsetX: 0,
  });

  useEffect(() => {
    setProfileAttrs((prev) => ({
      ...prev,
      x: isRight ? -1 : 140,
      y: 55,
      width: 180,
      height: 230,
      scaleX: 1,
      offsetX: 0,
    }));
  }, [isRight]);

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

  // Attach / detach transformer + update toolbar position
  useEffect(() => {
    if (!transformerRef.current || !profileImageRef.current) return;
    if (isProfileSelected) {
      transformerRef.current.nodes([profileImageRef.current]);
      updateToolbarPos();
    } else {
      transformerRef.current.nodes([]);
    }
    transformerRef.current.getLayer()?.batchDraw();
  }, [isProfileSelected]);

  // Recalculate toolbar position from current image attrs
  const updateToolbarPos = () => {
    const { x, y, width, scaleX, offsetX } = profileAttrs;
    // actual left edge accounting for flip offset
    const leftEdge = scaleX === -1 ? x - width : x;
    setToolbarPos({ x: leftEdge, y, width });
  };

  // Keep toolbar in sync whenever profileAttrs change while selected
  useEffect(() => {
    if (isProfileSelected) updateToolbarPos();
  }, [profileAttrs, isProfileSelected]);

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

  const [bgImage] = useImage(`${selected?.url || ""}`, "anonymous");
  const [Imagefooter] = useImage(
    "https://firebasestorage.googleapis.com/v0/b/mlmbooster.firebasestorage.app/o/graphics%2Flinks%2F1775306097021_qqhdl6.webp?alt=media&token=54d461df-8c6a-459d-be1d-505e7471ba50",
    "anonymous",
  );
  const [Imagel2] = useImage(mlmProfile?.logoURLs?.[0] || "", "anonymous");
  const [Imagel3] = useImage(mlmProfile?.logoURLs?.[1] || "", "anonymous");
  const [Imagel4] = useImage(mlmProfile?.logoURLs?.[2] || "", "anonymous");
  const [ImagetopFrame] = useImage(selectedTopFrame?.value || "", "anonymous");
  const [Imagetop1] = useImage(topuplineURLs?.[0] || "", "anonymous");
  const [Imagetop2] = useImage(topuplineURLs?.[1] || "", "anonymous");
  const [Imagetop3] = useImage(topuplineURLs?.[2] || "", "anonymous");
  const [Imagetop4] = useImage(topuplineURLs?.[3] || "", "anonymous");
  const [ImageProfile] = useImage(
    mlmForm?.promoter?.name
      ? `${mlmForm?.promoter?.image}`
      : `${mlmProfile?.profileImageURLs?.[0]}`,
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
    setIsProfileSelected(false);
    setTimeout(() => {
      const uri = stageRef.current.toDataURL({
        pixelRatio: EXPORT_PIXEL_RATIO,
        mimeType: "image/png",
        quality: 1,
      });
      downloadURI(uri, "stage-hd.png");
    }, 50);
  };

  // ── Flip horizontal ──────────────────────────────────────────────
  const handleFlip = (e) => {
    e.stopPropagation(); // prevent stage deselect
    setProfileAttrs((prev) => {
      const isFlipped = prev.scaleX === -1;
      return {
        ...prev,
        scaleX: isFlipped ? 1 : -1,
        offsetX: isFlipped ? 0 : prev.width,
      };
    });
  };

  // ── Toggle selection on image click/tap ─────────────────────────
  const handleProfileClick = () => {
    setIsProfileSelected((prev) => !prev);
  };

  // ── Drag: constrain within canvas bounds ────────────────────────
  const handleDragMove = (e) => {
    const node = e.target;
    const { width, height } = profileAttrs;
    const isFlipped = profileAttrs.scaleX === -1;

    const clampedX = isFlipped
      ? clamp(node.x(), width, STAGE_WIDTH)
      : clamp(node.x(), 0, STAGE_WIDTH - width);
    const clampedY = clamp(node.y(), 0, STAGE_HEIGHT - height);

    node.x(clampedX);
    node.y(clampedY);
  };

  const handleDragEnd = (e) => {
    setProfileAttrs((prev) => ({
      ...prev,
      x: e.target.x(),
      y: e.target.y(),
    }));
  };

  // ── Transform end: absorb scale into width/height ────────────────
  const handleTransformEnd = () => {
    const node = profileImageRef.current;
    if (!node) return;

    const absScaleX = Math.abs(node.scaleX());
    const absScaleY = Math.abs(node.scaleY());
    const newWidth = Math.max(20, node.width() * absScaleX);
    const newHeight = Math.max(20, node.height() * absScaleY);
    const isFlipped = profileAttrs.scaleX === -1;

    node.scaleX(isFlipped ? -1 : 1);
    node.scaleY(1);

    setProfileAttrs((prev) => ({
      ...prev,
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
      offsetX: isFlipped ? newWidth : 0,
    }));
  };

  // ── Stage background click → deselect ───────────────────────────
  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      setIsProfileSelected(false);
    }
  };

  // ── Transformer boundBoxFunc: keep resize inside canvas ─────────
  const boundBoxFunc = (oldBox, newBox) => {
    if (newBox.width < 20 || newBox.height < 20) return oldBox;
    const clampedX = clamp(newBox.x, 0, STAGE_WIDTH - newBox.width);
    const clampedY = clamp(newBox.y, 0, STAGE_HEIGHT - newBox.height);
    const clampedWidth = clamp(
      newBox.width,
      20,
      STAGE_WIDTH - clamp(newBox.x, 0, STAGE_WIDTH),
    );
    const clampedHeight = clamp(
      newBox.height,
      20,
      STAGE_HEIGHT - clamp(newBox.y, 0, STAGE_HEIGHT),
    );
    return {
      ...newBox,
      x: clampedX,
      y: clampedY,
      width: clampedWidth,
      height: clampedHeight,
    };
  };

  const ActualProfilename = profileName?.toUpperCase() || "PROFILENAME";
  const ActualDesignation = designation?.toUpperCase() || "DESIGNATION";

  let ProfilefontSize = 10;
  if (ActualProfilename?.length > 10 && ActualProfilename?.length <= 19)
    ProfilefontSize = 8;
  else if (ActualProfilename?.length > 19) ProfilefontSize = 6;

  let DesignationfontSize = 8;
  if (ActualDesignation?.length > 10 && ActualDesignation?.length <= 19)
    DesignationfontSize = 6;
  else if (ActualDesignation?.length > 19) DesignationfontSize = 5;

  // Toolbar sits above the image — clamp so it never goes off-canvas top
  const TOOLBAR_HEIGHT = 28;
  const TOOLBAR_WIDTH = 36;
  const toolbarTop = Math.max(0, toolbarPos.y - TOOLBAR_HEIGHT - 6);
  const toolbarLeft = clamp(
    toolbarPos.x + toolbarPos.width / 2 - TOOLBAR_WIDTH / 2,
    0,
    STAGE_WIDTH - TOOLBAR_WIDTH,
  );

  return (
    <div className="flex flex-col justify-start items-center h-full">
      <Button onClick={handleExport} className="mb-2">
        Export
      </Button>

      <TopuplineSelect
        frames={frames}
        onFrameSelect={(frame) => setSelectedTopFrame(frame)}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      />

      {/* Wrapper gives a positioning context for the floating toolbar */}
      <div
        ref={stageContainerRef}
        className="relative mt-2"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
      >
        {/* ── Floating flip toolbar ── */}
        {isProfileSelected && (
          <div
            // onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: toolbarTop,
              left: toolbarLeft,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(203, 202, 202, 0.7)",
              borderRadius: 30,
              padding: "4px",
              boxShadow: "0 2px 8px rgba(136, 133, 133, 0.35)",
            }}
          >
            {/* Flip icon button */}
            <button
              //    onClick={handleFlip}
              title="Flip horizontal"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25z" />
                <path d="M20.71 6.04a1 1 0 0 0 0-1.41L19.37 3.29a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.13-1.13z" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Konva Stage ── */}
        <Stage
          ref={stageRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="bg-slate-100 shadow-lg"
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
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

            <Image image={ImagetopFrame} x={95} y={2} width={30} height={30} />
            <Image image={ImagetopFrame} x={125} y={2} width={30} height={30} />
            <Image image={ImagetopFrame} x={155} y={2} width={30} height={30} />
            <Image image={ImagetopFrame} x={185} y={2} width={30} height={30} />

            <Image
              onTap={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              image={Imagetop1}
              x={101}
              y={6}
              width={18}
              height={18}
            />
            <Image
              onTap={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              image={Imagetop2}
              x={131}
              y={6}
              width={18}
              height={18}
            />
            <Image
              onTap={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              image={Imagetop3}
              x={161}
              y={6}
              width={18}
              height={18}
            />
            <Image
              onTap={() => setIsOpen(true)}
              onClick={() => setIsOpen(true)}
              image={Imagetop4}
              x={191}
              y={6}
              width={18}
              height={18}
            />

            {/* Profile image — rendered below footer so footer overlays it */}
            {isSubGeneralType ? (
              <Image
                ref={profileImageRef}
                image={ImageProfile}
                x={profileAttrs.x}
                y={profileAttrs.y}
                width={profileAttrs.width}
                height={profileAttrs.height}
                scaleX={profileAttrs.scaleX}
                offsetX={profileAttrs.offsetX}
                draggable
                onClick={handleProfileClick}
                onTap={handleProfileClick}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
              />
            ) : null}

            {/* Footer always on top */}
            {isRight ? (
              <Image
                scaleX={-1}
                scaleY={1}
                image={Imagefooter}
                x={320}
                y={280}
                width={350}
                height={41}
              />
            ) : (
              <Image
                image={Imagefooter}
                x={0}
                y={280}
                width={350}
                height={41}
              />
            )}

            {isRight ? (
              <>
                <Text
                  x={195}
                  y={295}
                  width={150}
                  height={5}
                  text="CALL FOR ASSOCIATION"
                  fontSize={7}
                  fill="white"
                  fontStyle="bold"
                  verticalAlign="middle"
                />
                <Text
                  x={190}
                  y={297}
                  width={150}
                  height={20}
                  text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                  fontSize={12}
                  fill="white"
                  fontStyle="bold"
                  verticalAlign="middle"
                />
                <Text
                  x={isSubGeneralType ? 40 : 76}
                  y={295}
                  width={100}
                  height={2}
                  text={ActualProfilename}
                  fontSize={ProfilefontSize}
                  fill="white"
                  fontStyle="1000"
                  align="center"
                  verticalAlign="middle"
                />
                <Text
                  x={isSubGeneralType ? 40 : 76}
                  y={303}
                  width={100}
                  height={2}
                  text={ActualDesignation}
                  fontSize={DesignationfontSize}
                  fill="white"
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                />
              </>
            ) : (
              <>
                <Text
                  x={43}
                  y={295}
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
                  y={297}
                  width={150}
                  height={20}
                  text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                  fontSize={12}
                  fill="white"
                  fontStyle="bold"
                  verticalAlign="middle"
                />
                <Text
                  x={133}
                  y={295}
                  width={isSubGeneralType ? 205 : 120}
                  height={2}
                  text={ActualProfilename}
                  fontSize={ProfilefontSize}
                  fill="white"
                  fontStyle="1000"
                  align="center"
                  verticalAlign="middle"
                />
                <Text
                  x={133}
                  y={303}
                  width={isSubGeneralType ? 205 : 120}
                  height={2}
                  text={ActualDesignation}
                  fontSize={DesignationfontSize}
                  fill="white"
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                />
              </>
            )}

            {isSubGeneralType ? null : isRight ? (
              <Image
                image={ImageProfile}
                x={-1}
                y={230}
                width={80}
                height={90}
              />
            ) : (
              <Image
                image={ImageProfile}
                x={240}
                y={230}
                width={80}
                height={90}
              />
            )}
            <Transformer
              ref={transformerRef}
              keepRatio={false}
              boundBoxFunc={boundBoxFunc}
            />
          </Layer>
        </Stage>
      </div>

      <ListOfTemplates selected={selected} setSelected={setSelected} />
    </div>
  );
}

export default GeneralEditPage;
