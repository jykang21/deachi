package kr.co.softbridge.daechilive.live.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
	int tokenIdx;
	String userType;

	String roomNo;
	String studentId;
	String studentNick;
	String teacherId;
	String studyTitle;
	String userLevel;
	int userIdx;
	
	int seatNumber;
	String warningCount;
	String warningReason;
	String questionStatus;
	String questionSeq;
	String tokenStatus;
	String enterTime;
	String exitTime;
	//List<UserDto> studentList = new ArrayList<UserDto>();
}
