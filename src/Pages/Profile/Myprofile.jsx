import { Button, Modal } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import editimage from "./edit.svg";
import ReferCard from "./ReferCard";
import SettingsMenu from "./Settingsmenu";

function Myprofile() {
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rawUser = localStorage.getItem("usermlm");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      setUserData(parsed);
      setNewName(parsed.name);
    }

    const rawProfile = localStorage.getItem("mlmProfile");
    if (rawProfile) {
      setProfileData(JSON.parse(rawProfile));
    }
  }, []);

  const handleEditSave = async (close) => {
    if (!newName.trim() || !userData) return;
    setLoading(true);

    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("mobileNo", "==", userData.mobileNo));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, { name: newName.trim() });

        const updated = { ...userData, name: newName.trim() };
        localStorage.setItem("usermlm", JSON.stringify(updated));
        setUserData(updated);
      }

      close();
    } catch (err) {
      console.error("Error updating name:", err);
    } finally {
      setLoading(false);
    }
  };

  const profileImageURL =
    profileData?.profileImageURLs?.[0] ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  if (!userData) return null;

  return (
    <div className="flex w-full flex-col justify-start items-center mb-4">
      {/* Back Arrow Header */}
      <div className="w-[95%] flex items-center mt-3 mb-1">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-700 ml-2">
          My Profile
        </span>
      </div>

      <div className="w-[95%] border  border-accent h-[100px] mt-2 rounded-lg flex flex-row items-center justify-between">
        {/* Avatar */}
        <div className="border border-slate-50 rounded-full w-[70px] h-[70px] ml-2 shrink-0">
          <img
            src={profileImageURL}
            alt="Profile"
            className="w-full h-full rounded-full object-contain"
          />
        </div>

        {/* Name & Mobile */}
        <div className="flex flex-col gap-1 flex-1 px-3">
          <h2 className="text-sm font-semibold">{userData.name}</h2>
          <p className="text-xs text-gray-500">+91{userData.mobileNo}</p>
        </div>

        {/* Right side */}
        <div className="flex h-full flex-col gap-6 justify-start items-start">
          <div className="text-xs  font-bold flex relative bottom-0.5 justify-center items-center text-white w-full h-4  bg-accent p-3 rounded-bl-xl rounded-tr-lg">
            <p>4 Days Left</p>
          </div>

          {/* Edit Modal */}
          <Modal>
            <Button
              variant="primary"
              className="w-[90%] mr-2 text-[10px] bg-white"
              size="sm"
            >
              <img src={editimage} alt="Edit" className="w-5 h-5" />
            </Button>

            <Modal.Backdrop>
              <Modal.Container placement="top">
                <Modal.Dialog className="w-full flex gap-3">
                  <Modal.CloseTrigger />

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="flex gap-2 w-full">
                    <Button
                      variant="secondary"
                      className="w-full"
                      slot="close"
                      onClick={() => setNewName(userData.name)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => handleEditSave(close)}
                      disabled={loading || !newName.trim()}
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </div>
      </div>
      <ReferCard />
      <SettingsMenu />
      
      <Button
        variant="outline"
        className="w-[95%] mt-6 text-red-500 border-red-300"
      >
        Logout
      </Button>
      <p className="text-xs text-accent mt-2">
        Made In India ❤️
      </p>
    </div>
  );
}

export default Myprofile;
