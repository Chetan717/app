import { Button, InputGroup, Chip, TextField } from "@heroui/react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useGeneralData } from "../../Context/GeneralContext";
import { db } from "../../../Firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router";

export default function SelectComp() {
  const navigate = useNavigate();
  const { theme, theame_color } = useGeneralData();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  const normalizeCompany = (doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      name: data?.name || "",
      address: data?.address || "",
      owner: data?.owner || "",
      designation: data?.profile || [],
      logos: data?.logos || [],
      topuplines: data?.topuplines || [],
      Plans: data?.Plans || [],
      profile: data?.profile || [],
      active: data?.active ?? false,
      launched: data?.launched ?? false,
    };
  };

  // ✅ Fetch with cleanup
  useEffect(() => {
    let cancelled = false;

    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "mlmcomp"));
        if (!cancelled) {
          const data = snapshot.docs.map((doc) =>
            normalizeCompany(doc)
          );
          
          setCompanies(data);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCompanies();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Optimized filtering
  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;

    const q = search.toLowerCase();
    return companies.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [search, companies]);

  // ✅ Toggle select
  const handleSelect = useCallback((company) => {
    setSelectedCompany((prev) =>
      prev?.id === company.id ? null : company
    );
  }, []);

  // ✅ Continue handler
  const handleContinue = useCallback(() => {
    if (!selectedCompany) {
      alert("Please select a company");
      return;
    }
    localStorage.setItem(
      "selectedCompany",
      JSON.stringify(selectedCompany)
    );
    navigate("/");
  }, [selectedCompany, navigate]);

  // ✅ Better logo handling
  const getLogo = (company) => {
    return (
      company?.logos?.find((l) => l?.link?.trim())?.link || ""
    );
  };

  return (
    <div className="flex flex-col gap-4 mt-4 justify-center items-center w-full">
      <div className="w-full space-y-3 p-2">
        <TextField
          aria-label="Search Company ..."
          className="w-full border text-xs rounded-lg"
          style={{ borderColor: theame_color }}
        >
          <InputGroup>
            <InputGroup.Input
              className="w-full text-sm"
              placeholder="Search Company ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroup.Suffix className="pr-2">
              <Chip size="sm" variant="soft">
                Search
              </Chip>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-9 gap-3 w-full p-2">
        {loading ? (
          <p className="text-sm">Loading...</p>
        ) : filteredCompanies.length === 0 ? (
          <p className="text-sm">No companies found</p>
        ) : (
          filteredCompanies.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`mr-3 w-[100px] p-2 border flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer
                ${
                  selectedCompany?.id === item.id
                    ? "border-[#0e245c]"
                    : theme === "dark"
                    ? "border-gray-600"
                    : "border-white"
                }
              `}
            >
              <img
                className="w-[90px] h-[90px] rounded-xl object-cover"
                src={getLogo(item)}
                alt="company"
              />

              <p
                className={
                  theme === "dark"
                    ? "text-white font-bold text-center text-[8px]"
                    : "text-gray-800 font-bold text-center text-[8px]"
                }
              >
                {item.name || "No Name"}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center items-center w-full p-2">
        <Button onClick={handleContinue} className="lg:w-1/3 w-full p-5">
          Continue With {selectedCompany?.name || ""}
        </Button>
      </div>
    </div>
  );
}