package kr.co.softbridge.daechilive.live.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LiveDto {
	private String dbNum;
	private String meetingCode;
	private String managerId;
	private String managerNick;
	private String maxPeople;
	private String title;
	private String quality;
	private String startTime;
	private String endTime;
	private String viewYn;
	private String password;
	private String meetingState;
	private String recYn;
	private String recDate;
	
	// LMS 컬럼변수
	// 토큰정보
	private int		onairIdx;		// 방번호
	private String	tokenUserType;	// 사용자유형
	private String	userKey;		// 사용자KEY
	private String	onairType;		// 방송유형(0:강의, 1:설명회)
	
	// 방송정보
	private int		lectureIdx;		// 강의번호
	private String	broadcastStDt;	// 방송시작시간
	private String	broadcastEdDt;	// 방송종료시간
	private int 	entryLimit;		// 최대참여자 수
	private int 	entryCnt;		// 현재참여자수
	private String	broadcastStatus;// 강의상태

	// 강의정보
	private int		courseIdx;		// 강좌번호
	private String	lectureTitle;	// 강의제목
	private String	lectureStatus;	// 강의상태(17001:대기  17002:진행  17003:휴강  17004:종료)
	private String	recVodFile;		// 수업녹화vod 원본파일명
	private String	recVodLink;		// 수업녹화vod 경로

	//  VOD강의정보
	private String	vodTitle;		// 동영상제목
	private String	vodType;		// 구분
	private String	vodLink;		// 동영상링크

	// 강좌정보
	private int		lecturerNo;		// 강사번호
	private String	courseTitle;	// 강좌명
	private String	parentVisitFg;	// 학부모 참관 가능여부 (1: Yes0: No)

	// 방송권한 강사 정보
	private int		operatorIdx;	// key
	private String	operatorFg;		// 구분
	private String	operatorId;		// 아이디
	private String	operatorNm;		// 이름
	private String	operatorMobile;	// 휴대폰번호
	private String	operatorEmail;	// 이메일
	
	// 강사/조교 접속정보
	private String	adminIdx;		// 강사/조교 접속자key
	private String	adminId;		// 접속자ID
	private String	adminNm;		// 접속자명
	private String	adminYn;		// 관리가능여부
	private String	adminProfileImg;// 접속강사/조교 프로필이미지경로 

	//  입장한 학생/학부모 정보
	private int		remoteIdx;		// 출석부순번
	private int		taskLectureIdx;	// 학생수강강의번호
	private int		userIdx;		// key
	private String	userType;		// 구분 (29001: 학생29002: 학부모)
	private String	userId;			// 아이디
	private String	userNm;			// 이름
	private int		warningsCnt;	// 경고건수
	private String	userProfileImg;	// 수강생프로필이미지
	
	// 출석정보
	private int		attendIdx;		// 출결번호
}
