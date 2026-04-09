import React from "react";
import { Stage, Layer, Image, Text, Transformer } from "react-konva";
import { STAGE_WIDTH, STAGE_HEIGHT, clamp } from "./Constants";

/**
 * KonvaCanvas
 * Renders the Konva Stage with all image layers, text overlays, and transformers.
 * All image objects and event handlers are passed in as props — this component
 * is purely presentational with no internal state.
 */
function KonvaCanvas({
  stageRef,
  // Images (from useImage)
  bgImage,
  StckerImage,
  Imagel2,
  Imagel3,
  Imagel4,
  ImagetopFrame,
  Imagetop1,
  Imagetop2,
  Imagetop3,
  Imagetop4,
  ImageForm,
  ImageProfile,
  // Profile image
  profileImageRef,
  profileAttrs,
  handleProfileClick,
  handleDragMove,
  handleDragEnd,
  handleTransformEnd,
  transformerRef,
  // Sticker image
  stickerImageRef,
  stickerAttrs,
  handleStickerClick,
  handleStickerDragMove,
  handleStickerDragEnd,
  handleStickerTransformEnd,
  stickerTransformerRef,
  // Stage events
  handleStageMouseDown,
  // Text data
  profileMobile,
  ActualProfilename,
  ActualDesignation,
  ActualAchvrname,
  ActualAchvrCity,
  // Font sizes
  ProfilefontSize,
  DesignationfontSize,
  AchieverNamefontSize,
  AchieverCityfontSize,
  // Layout flags
  isRight,
  isSubGeneralType,
  isSubGeneralType_birthday,
  // Modal triggers
  setIsOpen,
  setIsOpenFtr,
}) {
  const boundBoxFunc = (oldBox, newBox) => {
    if (newBox.width < 20 || newBox.height < 20) return oldBox;
    return {
      ...newBox,
      x: clamp(newBox.x, 0, STAGE_WIDTH - newBox.width),
      y: clamp(newBox.y, 0, STAGE_HEIGHT - newBox.height),
      width: clamp(newBox.width, 20, STAGE_WIDTH - clamp(newBox.x, 0, STAGE_WIDTH)),
      height: clamp(newBox.height, 20, STAGE_HEIGHT - clamp(newBox.y, 0, STAGE_HEIGHT)),
    };
  };

  return (
    <Stage
      ref={stageRef}
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      className="bg-slate-100 shadow-lg"
      onMouseDown={handleStageMouseDown}
      onTouchStart={handleStageMouseDown}
    >
      <Layer>
        {/* Background */}
        <Image image={bgImage} x={0} y={0} width={STAGE_WIDTH} height={STAGE_HEIGHT} />

        {/* Logos */}
        <Image image={Imagel2} x={3}   y={2} width={25} height={25} />
        <Image image={Imagel3} x={260} y={2} width={25} height={25} />
        <Image image={Imagel4} x={290} y={2} width={25} height={25} />

        {/* Top frames */}
        <Image image={ImagetopFrame} x={95}  y={2} width={30} height={30} />
        <Image image={ImagetopFrame} x={125} y={2} width={30} height={30} />
        <Image image={ImagetopFrame} x={155} y={2} width={30} height={30} />
        <Image image={ImagetopFrame} x={185} y={2} width={30} height={30} />

        {/* Top-line profile images */}
        <Image image={Imagetop1} x={101} y={6} width={18} height={18} onTap={() => setIsOpen(true)} onClick={() => setIsOpen(true)} />
        <Image image={Imagetop2} x={131} y={6} width={18} height={18} onTap={() => setIsOpen(true)} onClick={() => setIsOpen(true)} />
        <Image image={Imagetop3} x={161} y={6} width={18} height={18} onTap={() => setIsOpen(true)} onClick={() => setIsOpen(true)} />
        <Image image={Imagetop4} x={191} y={6} width={18} height={18} onTap={() => setIsOpen(true)} onClick={() => setIsOpen(true)} />

        {/* Draggable profile image */}
        <Image
          ref={profileImageRef}
          image={ImageForm}
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

        {/* Draggable sticker image */}
        <Image
          ref={stickerImageRef}
          image={StckerImage}
          x={stickerAttrs.x}
          y={stickerAttrs.y}
          width={stickerAttrs.width}
          height={stickerAttrs.height}
          scaleX={stickerAttrs.scaleX}
          offsetX={stickerAttrs.offsetX}
          draggable
          onClick={handleStickerClick}
          onTap={handleStickerClick}
          onDragMove={handleStickerDragMove}
          onDragEnd={handleStickerDragEnd}
          onTransformEnd={handleStickerTransformEnd}
        />

        {/* Footer text */}
        {isRight ? (
          <>
            <Text x={218} y={295} width={150} height={5}  text="CALL FOR ASSOCIATION" fontSize={5}  fill="white" fontStyle="bold"  verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={205} y={297} width={150} height={20} text={`+91${profileMobile}` || "+91XXXXXXXXXX"} fontSize={11} fill="white" fontStyle="bold" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={isSubGeneralType ? -10 : 70}  y={297} width={isSubGeneralType ? 205 : 120} height={2} text={ActualProfilename}  fontSize={ProfilefontSize}    fill="white" fontStyle="1000" align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={isSubGeneralType ? -10 : 70}  y={305} width={isSubGeneralType ? 205 : 120} height={2} text={ActualDesignation}   fontSize={DesignationfontSize} fill="white" fontStyle="bold"  align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
          </>
        ) : (
          <>
            <Text x={37}  y={295} width={150} height={5}  text="CALL FOR ASSOCIATION" fontSize={5}  fill="white" fontStyle="bold"  verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={30}  y={297} width={150} height={20} text={`+91${profileMobile}` || "+91XXXXXXXXXX"} fontSize={11} fill="white" fontStyle="bold" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={133} y={297} width={isSubGeneralType ? 205 : 120} height={2} text={ActualProfilename}  fontSize={ProfilefontSize}    fill="white" fontStyle="1000" align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={133} y={305} width={isSubGeneralType ? 205 : 120} height={2} text={ActualDesignation}   fontSize={DesignationfontSize} fill="white" fontStyle="bold"  align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
          </>
        )}

        {/* Achiever details */}
        {isRight ? (
          <>
            <Text x={isSubGeneralType_birthday ? 35 : 55} y={isSubGeneralType_birthday ? 157 : 97}  width={120} height={2} text={ActualAchvrname} fontSize={AchieverNamefontSize} fill="white" fontStyle="1000" align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={isSubGeneralType_birthday ? 35 : 55} y={isSubGeneralType_birthday ? 172 : 110} width={120} height={2} text={ActualAchvrCity} fontSize={AchieverCityfontSize} fill="white" fontStyle="1000" align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
          </>
        ) : (
          <>
            <Text x={isSubGeneralType_birthday ? 170 : 142} y={isSubGeneralType_birthday ? 157 : 97}  width={120} height={2} text={ActualAchvrname} fontSize={AchieverNamefontSize} fill="white" fontStyle="1000" align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
            <Text x={isSubGeneralType_birthday ? 170 : 142} y={isSubGeneralType_birthday ? 172 : 111} width={120} height={2} text={ActualAchvrCity} fontSize={AchieverCityfontSize} fill="white" fontStyle="1000" align="center" verticalAlign="middle" onClick={() => setIsOpenFtr(true)} onTap={() => setIsOpenFtr(true)} />
          </>
        )}

        {/* Small promoter profile image */}
        {!isSubGeneralType && (
          isRight ? (
            <Image image={ImageProfile} x={70}  y={240} scaleX={-1} width={80} height={80} />
          ) : (
            <Image image={ImageProfile} x={249} y={240} scaleX={1}  width={80} height={80} />
          )
        )}

        {/* Transformers */}
        <Transformer ref={transformerRef}       keepRatio={false} boundBoxFunc={boundBoxFunc} />
        <Transformer ref={stickerTransformerRef} keepRatio={false} boundBoxFunc={boundBoxFunc} />
      </Layer>
    </Stage>
  );
}

export default KonvaCanvas;