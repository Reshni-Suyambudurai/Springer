import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hiringCycleApi } from "../../../services/hiring.api";
import type { HiringCycleSummaryResponse } from "../../../types/TA_Recruiter/Hiring/hiringCycle.types";
import { showToast } from "../../../utils/toast";
import { handleAxiosError } from "../../../services/api.error";
import "../../../css/TA_Recruiter/DriveProcess/DriveCycle.css";

const DriveCycle: React.FC = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<HiringCycleSummaryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCycleSummaries();
  }, []);

  const fetchCycleSummaries = async () => {
    try {
      setLoading(true);
      const response = await hiringCycleApi.getAllCycleSummaries();
      
      if (response.success && response.data) {
        setCycles(response.data);
      } else {
        showToast(response.message || "Failed to fetch hiring cycles", "error");
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCycleClick = (cycleId: number) => {
    navigate(`/drive-process/drive-list/${cycleId}`);
  };

  if (loading) {
    return (
      <div className="drive-cycle-container">
        <div className="drive-cycle-loading">Loading hiring cycles...</div>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="drive-cycle-container">
        <div className="drive-cycle-empty">No hiring cycles found</div>
      </div>
    );
  }

  return (
    <div className="drive-cycle-container">
      <h2 className="drive-cycle-title">Hiring Cycles</h2>
      <div className="drive-cycle-grid">
        {cycles.map((cycle) => (
          <div 
            key={cycle.cycleId} 
            className="drive-cycle-card"
            onClick={() => handleCycleClick(cycle.cycleId)}
          >
            <div className="drive-cycle-card-header">
              <h3 className="drive-cycle-card-name">{cycle.cycleName}</h3>
              <span className={`drive-cycle-card-status drive-cycle-status-${cycle.status.toLowerCase()}`}>
                {cycle.status}
              </span>
            </div>
            <div className="drive-cycle-card-body">
              <div className="drive-cycle-card-info">
                <span className="drive-cycle-card-label">Year:</span>
                <span className="drive-cycle-card-value">{cycle.cycleYear}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriveCycle;
