package com.kanini.springer.mapper.Hiring;

import com.kanini.springer.dto.Hiring.CycleWithDrivesResponse;
import com.kanini.springer.dto.Hiring.HiringCycleResponse;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Component
public class HiringCycleMapper {
    
    public HiringCycleResponse toResponse(HiringCycle cycle) {
        HiringCycleResponse response = new HiringCycleResponse();
        response.setCycleId(cycle.getCycleId());
        response.setCycleYear(cycle.getCycleYear());
        response.setCycleName(cycle.getCycleName());
        response.setCompensationBand(cycle.getCompensationBand());
        response.setBudget(cycle.getBudget());
        response.setHasJd(cycle.getJd() != null && cycle.getJd().length > 0);
        response.setStatus(cycle.getStatus().toString());
        response.setCreatedAt(cycle.getCreatedAt());
        return response;
    }
    
    public CycleWithDrivesResponse toCycleWithDrivesResponse(HiringCycle cycle) {
        CycleWithDrivesResponse response = new CycleWithDrivesResponse();
        response.setCycleId(cycle.getCycleId());
        response.setCycleName(cycle.getCycleName());
        response.setCycleYear(cycle.getCycleYear());
        response.setStatus(cycle.getStatus().toString());
        
        if (cycle.getDrives() != null && !cycle.getDrives().isEmpty()) {
            response.setDrives(cycle.getDrives().stream()
                    .map(drive -> new CycleWithDrivesResponse.DriveInfo(
                            drive.getDriveId(),
                            drive.getDriveName(),
                            drive.getDriveMode() != null ? drive.getDriveMode().toString() : null
                    ))
                    .collect(Collectors.toList()));
        } else {
            response.setDrives(new ArrayList<>());
        }
        
        return response;
    }
}
