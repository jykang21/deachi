package kr.co.softbridge.daechilive.live.mapper;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import kr.co.softbridge.daechilive.live.dto.LiveDto;
import kr.co.softbridge.daechilive.live.dto.TokenDto;
import kr.co.softbridge.daechilive.live.dto.UserDto;


@Mapper
public interface LiveMapper {
	List<LiveDto> selectLiveList(Map<String, Object> paramMap) throws Exception;
	List<TokenDto> selectTokenList(Map<String, Object> paramMap) throws Exception;
	void setStudyWarning(Map<String, Object> paramMap) throws Exception;
	void closeRoom(String meetingCode) throws Exception;
	void updateTokenList(String string) throws Exception;
	LiveDto getTokenSelect(int token) throws Exception;
	int closeToken(HashMap<String, Object> paramMap);
	ArrayList<UserDto> getAttendance(int roomNo) throws Exception;
	int insertAttendance(HashMap<String, Object> paramMap);
	int getAttendIdx(HashMap<String, Object> paramMap);
	List<LiveDto> getOnAirDataList(HashMap<String, Object> paramMap);
	int setOnAirStatus(HashMap<String, Object> paramMap);
	int setStartOnair(HashMap<String, Object> paramMap);
	
	/* 경고정보처리 */
	HashMap<String, Object> getStudentIdx(Map<String, Object> paramMap);
	HashMap<String, Object> getOnairLecture(Map<String, Object> paramMap);
	HashMap<String, Object> getStudentTakeCourse(Map<String, Object> paramMap);
	HashMap<String, Object> getWarningAttendIdx(Map<String, Object> paramMap);
	int updateLectureWarningsCnt(Map<String, Object> paramMap);
	int updateAttendanceStatus(Map<String, Object> paramMap);
	int insertStudyWarningLog(Map<String, Object> paramMap);
	/* //경고정보처리 */
	
	/* 강의실 입장한 학생수 업데이트 */
	void updateOnairStudentCnt(HashMap<String, Object> paramMap);
	
	/* 샘플 DAO */
	void regToken();
	String getTokenIdString();
	List<HashMap<String, Object>> tokenList();
	void resetOnAirData();
	
	/* 알림톡 발송등록 */
	void setSjw1_8847_1(HashMap<String, Object> paramMap); // 플레이어에서 테스트 환경을 종료하고 강의로 전환했을 때 학생에게
	void setSjw1_8869_1(HashMap<String, Object> paramMap); // [수업 중 경고 3회 이상부터 부여 시 마다] 해당학생의 학부모에게
	void setSjw1_9760_1(HashMap<String, Object> paramMap); // [수업 중] 중도이탈
	int setSjw1_9758_1(HashMap<String, Object> paramMap); // 테스트 종료시
	int setSjw1_9764_1(HashMap<String, Object> paramMap); // 출석
}
