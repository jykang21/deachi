package kr.co.softbridge.daechilive.live.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TokenDto {
	
	private String userKey;
	private String userType;
	private String userStatus;
	private String userId;
	private String userPw;
	private String userNm;
	private String userCi;
	private String markeingFg;
	private String agreeDt;
	private String lastAccessDt;
	private String passChangeDt;
	private String loginFailCnt;
	private String regDt;
	private String updDt;

}
