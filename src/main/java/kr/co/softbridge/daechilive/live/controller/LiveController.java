package kr.co.softbridge.daechilive.live.controller;

import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import kr.co.softbridge.daechilive.live.dto.AlimtalkResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.RequestContextUtils;

import com.google.gson.Gson;

import kr.co.softbridge.daechilive.live.service.LiveService;

@Controller 
@RequestMapping("/live")
public class LiveController {

    @Autowired(required = false)
	private LiveService liveService;
    
    @Value("${daechilive.upload.path}")
    private String uploadPath;
    
    @Value("${daechilive.contServ.media}")
    private String mediaUrl;
    
    @Value("${daechilive.contServ.media}")
    private String mediaControlUrl;

    @Value("${modoodaechi.https.url}")
    private String modoodaechiUrl;
    
    @Value("${daechilive.contServ.chat}")
    private String chatUrl;
	
    @RequestMapping(value = "/enter")
    public String playerEnter(HttpServletRequest request) {
    	return "live/player_enter";
    }
	
	@RequestMapping(value = "/setting")
    public String playerRoomSetting() {
        return "live/liveSetting";
    }

	@PostMapping(value = "/test1endingtalk")
	public @ResponseBody AlimtalkResponseDto test1endingtalkSend(@RequestParam HashMap<String, Object> paramMap) {
		int result = liveService.setSjw1_9758_1(paramMap);

		return AlimtalkResponseDto.builder()
				.result(result)
				.build();
	}
	
	@RequestMapping(value = "/videoroom")
	public String liveVideoRoom(@RequestParam HashMap<String, Object> paramMap, HttpServletRequest request, HttpServletResponse response,Model model) throws Exception {
		System.out.println("liveVideoRoom START");
    	response.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
		String rtnUrl = "live/error";	// 리턴할 HTML파일경로
		Map<String, ?> flashMap = RequestContextUtils.getInputFlashMap(request);
		Map<String, ?> flashMap2 = RequestContextUtils.getOutputFlashMap(request);

	    if(flashMap != null){
	    	paramMap = (HashMap<String, Object>) flashMap.get("tokenMap");
	    }
	    
	    
		String tokenUserType = ((String) paramMap.get("tokenUserType")).equals("")? "": (String) paramMap.get("tokenUserType");	// 토큰유저구분
		HashMap<String, Object> liveMap = liveService.getLiveDataList(paramMap);	// 목록조회
		
		// step1. socket conn 정보 조회
		String mediaInfo = null;
		String chatInfo = null;

		// step2. 응답 설정
		/*
		 * 강의에 필요한 정보를 화면에 보내기위한 JSON Object형식으로 변환한여 model에 담는다.
		 */
		Gson gson = new Gson();
		String lectureData = gson.toJson(liveMap.get("lectureData"));
		String studentList = gson.toJson(liveMap.get("studentList"));
		model.addAttribute("lectureData", lectureData);		// 강의정보
		model.addAttribute("studentList", studentList);		// 학생목록

		HashMap<String, Object> lecture = (HashMap<String, Object>) liveMap.get("lectureData");
		List<HashMap<String, Object>> sMapList = (List<HashMap<String, Object>>) liveMap.get("studentList");
		HashMap<String, Object> student = (HashMap<String, Object>) sMapList.get(0);
		
		if(("24004").equals(lecture.get("broadcastStatus"))) {
			model.addAttribute("onAirCheck", "close");
			rtnUrl = "live/liveGate";
		} else {
			// 사용자토큰유형에 따른 정보 처리
			if (tokenUserType.equals("0") || tokenUserType.equals("1")) {
				String adminYn = (String) lecture.get("adminYn");
				
				if(adminYn.equals("N")) { // 대상강의 담당 강사 또는 담당 조교가 아닌경우 
					PrintWriter out = response.getWriter(); 
					response.setContentType("text/html; charset=utf-8");
					out.print("<script>alert('권한이 없는 사용자입니다.');</script>");
					out.flush(); 
				}
				
				if(tokenUserType.equals("0")) {
					if(("24001").equals(lecture.get("broadcastStatus"))) {
						HashMap<String, Object> onAirTestModeMap = new HashMap<String, Object>();
						onAirTestModeMap.put("onairIdx", paramMap.get("onairIdx"));
						onAirTestModeMap.put("broadcastStatus", "24002");
						liveService.setStartOnair(onAirTestModeMap);
					}
					rtnUrl = "live/liveTeacher";
				} else {
					rtnUrl = "live/liveAssistant";
				}

				// mediaInfo = liveService.connInfo("media", mediaUrl, (String) paramMap.get("onairIdx"), (String) paramMap.get("userLevel"), (String) lecture.get("adminId"));
				// chatInfo = liveService.connInfo("chat", chatUrl, (String) paramMap.get("onairIdx"), (String) paramMap.get("userLevel"), (String) lecture.get("adminId"));
				model.addAttribute("userId", lecture.get("adminId"));
				model.addAttribute("userNick", lecture.get("adminNm"));
			} else if (tokenUserType.equals("2") || tokenUserType.equals("3")) {
				rtnUrl = "live/liveStudent";
				model.addAttribute("userId", student.get("userId"));
				model.addAttribute("userNick", student.get("userNm"));
				// mediaInfo = liveService.connInfo("media", mediaUrl, (String) paramMap.get("onairIdx"), (String) paramMap.get("userLevel"), (String) student.get("userId"));
				// chatInfo = liveService.connInfo("chat", chatUrl, (String) paramMap.get("onairIdx"), (String) paramMap.get("userLevel"), (String) student.get("userId"));
				
				/* 출석처리
				 * 방송유형이 강의이면 학생만 출석처리
				 * 방송유형이 설명회면 학생,학부모 모두 출석처리
				 */
				boolean attendanceProcTargetFlg = true;
				String onairType = (String) paramMap.get("onairType");
				if(onairType.equals("0") && tokenUserType.equals("3"))	attendanceProcTargetFlg = false;
				
				if(attendanceProcTargetFlg) {
					HashMap<String, Object> attendanceMap = new HashMap<String, Object>();
					
					attendanceMap.put("lectureIdx", lecture.get("lectureIdx"));
					attendanceMap.put("taskLectureIdx", student.get("taskLectureIdx"));
					attendanceMap.put("attendIdx", 0);
					
					int attendanceStatus = liveService.insertAttendance(attendanceMap);	// 방송출석처리
					if (attendanceStatus == 0) {
						model.addAttribute("attendanceMessages", "출석처리가 실패되었습니다.");
					}
					int attendanceResult = liveService.setSjw1_9764_1(attendanceMap);   // 출석처리 알림톡 발송
				}
				
			} else {
				// 정의된 사용자토큰타입이 아닌경우 종료
	    		PrintWriter out = response.getWriter();
	    		response.setContentType("text/html; charset=utf-8");
	    		out.print("<script>alert('failed token');</script>");
	    		out.flush();
			}
			
			// soket정보 model적재
			model.addAttribute("mediaUrl", mediaInfo);
			model.addAttribute("mediaControlUrl", mediaControlUrl);
			model.addAttribute("chatUrl", chatInfo);
			model.addAttribute("modoodaechiUrl", modoodaechiUrl);
	
			// 스크립트 전역변수에 담을 값을 model에 적재
			model.addAttribute("title",  " [" + lecture.get("courseTitle") + "]\t" + lecture.get("lectureTitle"));
			model.addAttribute("onairIdx", paramMap.get("onairIdx"));
			model.addAttribute("userKey", paramMap.get("userKey"));
			model.addAttribute("userLevel", paramMap.get("userLevel"));
			model.addAttribute("liveCode", paramMap.get("onairIdx"));
			model.addAttribute("tokenUserType", paramMap.get("tokenUserType"));
			model.addAttribute("managerId", lecture.get("operatorId"));
			model.addAttribute("startTime", lecture.get("broadcastStDt"));
			model.addAttribute("endTime", lecture.get("broadcastEdDt"));

			if (tokenUserType.equals("0") || tokenUserType.equals("1")) {
				model.addAttribute("maxPeople", sMapList.size());
			} else {
				model.addAttribute("maxPeople", lecture.get("entryLimit"));
			}
		}
				
		return rtnUrl;
	}
	
	@RequestMapping(value = "/teacher/screen")
    public String liveTeacherScreen() throws Exception {
        return "live/liveTeacherScreen";
    }
	
	@RequestMapping(value = "/teacher/rec")
    public String liveRec(@RequestParam HashMap<String, Object> paramMap, Model model) throws Exception {
		// step1. socket conn 정보 조회
		// String mediaInfo = liveService.connInfo("media", mediaUrl, (String) paramMap.get("liveCd"), (String) paramMap.get("userLevel"), (String) paramMap.get("userId"));
		// String chatInfo = liveService.connInfo("chat", chatUrl, (String) paramMap.get("liveCd"), (String) paramMap.get("userLevel"), (String) paramMap.get("userId"));
		// step2. 응답 설정
		model.addAttribute("mediaUrl", null);
		model.addAttribute("chatUrl", null);
		model.addAttribute("liveCode", paramMap.get("liveCd"));
		model.addAttribute("userId", paramMap.get("userId"));
		model.addAttribute("userLevel", paramMap.get("userLevel"));
		model.addAttribute("managerId", paramMap.get("managerId"));
		model.addAttribute("maxPeople", paramMap.get("maxPeople"));
        return "live/liveTeacherRec";
    }
	
	@RequestMapping(value = "/fileUpload",method = RequestMethod.POST)
	public void liveFileUpload(@RequestParam("file") MultipartFile file,HttpServletRequest request, HttpServletResponse response) throws Exception {
		// 파일 업로드 service 호출
		liveService.fileUploadService(file,request,response,uploadPath);
	}
	
	@RequestMapping(value = "/exam")
    public String liveExam() {
        return "live/liveExam";
    }
	
	@RequestMapping(value = "/examList")
    public String liveExamList() {
        return "live/liveTeacherExmList";
    }
	
	@RequestMapping(value="/fileDownload")
	public void liveFileDownload(HttpServletRequest request, HttpServletResponse response) throws Exception {
		// 파일 다운로드 service 호출
		liveService.fileDownloadService(request,response,uploadPath);
	}
	
	@RequestMapping(value="/setStudyWarning")
	public void setStudyWarning(@RequestParam HashMap<String, Object> paramMap,HttpServletRequest request, HttpServletResponse response) throws Exception {
		// Ajax로 보내줄 리턴값 한글처리
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
		// 프로시저 호출 null떨어져서 수정중
		paramMap.put("resultCode", "");
		paramMap.put("resultMessage", "");
		liveService.setStudyWarning(paramMap);
		
		Gson gson = new Gson();
		String resultMap = gson.toJson(paramMap);
		response.getWriter().print(resultMap);
	}
	
	@RequestMapping(value="/setStartOnair")
	public void setStartOnair(@RequestParam HashMap<String, Object> paramMap,HttpServletRequest request, HttpServletResponse response) {
		System.out.println(paramMap);
		String updateStatusFlg = liveService.startOnair(paramMap);
		try {
			response.getWriter().print(updateStatusFlg);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	/* 서버시간 취득하여 String으로 리턴 */
	@RequestMapping(value = "/getServerTime")
	public void getServerTime(@RequestParam HashMap<String, Object> paramMap,HttpServletRequest request, HttpServletResponse response) {
		Calendar calendar = Calendar.getInstance();
        Locale currentLocale = new Locale("KOREAN", "KOREA");
        String pattern = "yyyyMMddHHmmss";
        SimpleDateFormat formatter = new SimpleDateFormat(pattern, currentLocale);
        
        String toDay = formatter.format(calendar.getTime());
        try {
			response.getWriter().print(toDay);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	/* 강의실 입장한 학생수 업데이트 */
	@RequestMapping(value="/setOnairStudentCnt")
	public void setOnairStudentCnt(@RequestParam HashMap<String, Object> paramMap,HttpServletRequest request, HttpServletResponse response) {
		System.out.println(paramMap);
		liveService.updateOnairStudentCnt(paramMap);
	}

	/* 방폭 페이지 이동*/
	@RequestMapping(value= "/roomexit")
	public String roomexit(@RequestParam HashMap<String, Object> paramMap, HttpServletRequest request, HttpServletResponse response,Model model) throws Exception {
		return "live/liveRoomExit";
	}
}