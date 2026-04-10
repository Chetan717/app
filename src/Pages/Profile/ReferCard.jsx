import { useState, useEffect } from "react";
import { Copy, Check } from "@gravity-ui/icons";
import referGraphic from "./refer.png";

export default function ReferCard() {
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usermlm");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const referCode = user?.referCode || "—";

  const handleCopy = async () => {
    if (!user?.referCode) return;
    try {
      await navigator.clipboard.writeText(user.referCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that block clipboard API
      const el = document.createElement("textarea");
      el.value = user.referCode;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReferNow = () => {
    const msg = `Join using my referral code: ${referCode}`;
    if (navigator.share) navigator.share({ title: "Join & earn 1 month free!", text: msg });
    else alert(msg);
  };

  const handleShare = () => {
    const msg = `Hey! Use my refer code ${referCode} and get 1 month FREE. Join now!`;
    if (navigator.share) navigator.share({ title: "Refer & Earn", text: msg });
    else navigator.clipboard.writeText(msg).then(() => alert("Share message copied!"));
  };

  return (
    <div className="flex w-full justify-center items-center p-2">
      <div
        className="relative overflow-hidden rounded-2xl p-5 w-full"
        style={{ background: "linear-gradient(135deg, #e8005a, #ff3b7a)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -right-8 -top-6 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute right-8 -bottom-10 w-24 h-24 rounded-full bg-white/[0.06]" />

        {/* Left content — capped at 58% width so image has room */}
        <div className="relative z-10 max-w-[58%]">
          <p className="text-white/85  text-[10px] mb-2">
            Refer & Earn up to{" "}
            <span className="text-[11px] text-white">1 Month FREE*</span>
          </p>

          {/* Code box */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 bg-white/15 border border-white/30 rounded-xl px-3 py-2">
              <span className="text-white text-base font-mono font-medium tracking-widest">
                {referCode}
              </span>
              <button
                onClick={handleCopy}
                className="text-white/80 hover:text-white transition-colors flex items-center justify-center"
              >
                {copied ? (
                  <Check width={16} height={16} className="text-green-300" />
                ) : (
                  <Copy width={16} height={16} />
                )}
              </button>
            </div>
            {copied && (
              <span className="text-green-300 text-xs font-medium">Copied!</span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleReferNow}
              className="bg-white text-pink-600 font-medium text-xs px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Refer Now
            </button>
            <button
              onClick={handleShare}
              className="bg-transparent text-white border border-white/50 font-medium text-xs px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
            >
              Share
            </button>
          </div>
        </div>

        {/* Graphic image */}
        <img
          src={referGraphic}
          alt="refer graphic"
          className="absolute w-[130px] -bottom-0 -right-0 object-contain pointer-events-none"
        />
      </div>
    </div>
  );
}