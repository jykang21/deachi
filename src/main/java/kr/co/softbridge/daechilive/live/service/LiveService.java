package kr.co.softbridge.daechilive.live.service;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.concurrent.atomic.AtomicInteger;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import io.socket.client.IO;
import okhttp3.OkHttpClient;
import io.socket.client.Socket;
import kr.co.softbridge.daechilive.constant.LiveConstant;
import kr.co.softbridge.daechilive.live.dto.LiveDto;
import kr.co.softbridge.daechilive.live.dto.TokenDto;
import kr.co.softbridge.daechilive.live.dto.UserDto;
import kr.co.softbridge.daechilive.live.mapper.LiveMapper;

@Service
public class LiveService implements LiveMapper {
    
    @Value("${modoodaechi.https.url}")
    private String modoodaechiUrl;
	
	@Autowired(required = false)
	private LiveMapper liveMapper;
	
	@Override
	public List<LiveDto> selectLiveList(Map<String, Object> paramMap) throws Exception {
		List<LiveDto> liveList = liveMapper.selectLiveList(paramMap);
		return liveList;
	}
	
	@Override
	public List<TokenDto> selectTokenList(Map<String, Object> paramMap) throws Exception {
		List<TokenDto> TokenList = liveMapper.selectTokenList(paramMap);
		return TokenList;
	}
	
	public String connInfo(String lbGb, String url, String roomNo, String userLevel, String userId) throws URISyntaxException {
		String result = "";
		AtomicInteger reqCnt = new AtomicInteger();
		try {
	        String repId = "";
	        boolean wait = true;
			Map<String, Object> connInfo = new HashMap<String, Object>();
			IO.Options options = new IO.Options();
			set(options);
			System.out.println("options: " + options);
			System.out.println("url: " + url);
        	Socket socket = IO.socket(url, options);
			System.out.println("connect()");
			socket.connect();
			socket.on(Socket.EVENT_CONNECT, (Object... args) -> {
				System.out.println("socket.on()");
				String reqId = "";
	            JSONObject reqObj = new JSONObject();
            	reqObj.put("RoomCode", roomNo);
            	reqObj.put("UserLevel", userLevel);
            	reqObj.put("UserId", userId);
				System.out.println("RoomCode : " + roomNo);
				System.out.println("userLevel : " + userLevel);
				System.out.println("UserId : " + userId);
	            if(lbGb.equals("media")) {
	            	reqId = "req-get-mediaserver";
	            } else if(lbGb.equals("chat")) {
	            	reqId = "req-get-chatserver";
	            }
				System.out.println(" socket.emit() reqId : " + reqId);
				System.out.println(" reqCount: " + reqCnt.getAndIncrement());
				if( reqCnt.intValue() > 100) {
					// ?????? ??? ????????? ???????????? ?????????
					socket.disconnect();
				}
	            socket.emit(reqId, reqObj);

			});
	        if(lbGb.equals("media")) {
	        	repId = "rep-get-mediaserver";
	        } else if(lbGb.equals("chat")) {
	        	repId = "rep-get-chatserver";
	        }

	        socket.on(repId, (Object... args) -> {
	            JSONObject repObj = (JSONObject) args[0];
	            connInfo.put("domain", repObj.get("DOMAIN"));
	            connInfo.put("port", repObj.get("PORT"));
	        });
	        while(wait) {
	        	Thread.sleep(10); //0.01?????? ????????????
	        	if(connInfo.size() > 0) {
	        		if(lbGb.equals("media")) {
		            	result = "wss://"+connInfo.get("domain")+":"+connInfo.get("port")+"/janus";
		            } else if(lbGb.equals("chat")) {
		            	result = "https://"+connInfo.get("domain")+":"+connInfo.get("port");
		            }
			        if(socket != null) { socket.close(); }
			        wait = false;
	        	}
			}
		} catch(Exception e) {
			e.printStackTrace();
		}
        return result;
    }
    
    public static OkHttpClient getOkHttpClient() {
        try {
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, new TrustManager[]{new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {}

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {}

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            }}, new java.security.SecureRandom());

            OkHttpClient.Builder builder = new OkHttpClient.Builder();

            builder.hostnameVerifier(new HostnameVerifier() {
                @Override
                public boolean verify(String hostname, SSLSession session) {
                    return true;
                }
            });

            builder.sslSocketFactory(sc.getSocketFactory(), new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {}

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {}

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
            });

            return builder.build();
        } catch (NoSuchAlgorithmException | KeyManagementException ex) {
            ex.printStackTrace();
        }
        return null;
    }

    public static void set(IO.Options options) {
        OkHttpClient okHttpClient = getOkHttpClient();
        IO.setDefaultOkHttpWebSocketFactory(okHttpClient);
        IO.setDefaultOkHttpCallFactory(okHttpClient);
        options.callFactory = okHttpClient;
        options.webSocketFactory = okHttpClient;
    }
    
    public void fileUploadService(MultipartFile file,HttpServletRequest request ,HttpServletResponse response,String uploadPath) {
    	String originalFileName = file.getOriginalFilename();			// ??????????????? file??? ??????????????????
    	int index = originalFileName.lastIndexOf(".");					// ???????????? ???????????? "."??? index
		String extension = originalFileName.substring(index+1); 		// ????????? ???
		String roomNo = request.getParameter("roomNo");					// ????????? ??? ??????
		String seq = request.getParameter("seq");						// ????????? ?????? ???????????????
		String uploadFileName = seq+"."+extension;						// ????????? ??????????????? ?????? ??? : ex) 1.txt
		String saveFile = uploadPath+"/"+roomNo+"/"+uploadFileName;		// uploadPath + roomNo + ???????????? : ex) D:/daechilive/upload/101000010/1.txt
    	// roomNo ?????? ??????
		File folder = new File(uploadPath+"/"+roomNo);					// D:/daechilive/upload/101000010 ?????? ??????
		// ????????? ???????????? ????????? ??????
		if(!folder.exists()) {
			folder.mkdir();
		}
		// ?????????
		try {
			file.transferTo(new File(saveFile));
		} catch (Exception e) {
			e.printStackTrace();
		}
    }
    
    public void fileDownloadService(HttpServletRequest request,HttpServletResponse response,String uploadPath) throws UnsupportedEncodingException {
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
    	String roomNo = request.getParameter("roomNo");					// ???????????? ??? ??????
		String seq = request.getParameter("seq");						// ???????????? ?????? ???????????????
		String viewFileName = request.getParameter("viewFileName"); 	// ???????????? ?????? ??? : ex) test.png 
		int index = viewFileName.lastIndexOf(".");						// ???????????? ???????????? "."??? index
		String extension = viewFileName.substring(index+1); 			// ????????? ???
		String path = uploadPath+"/"+roomNo+"/"+seq+"."+extension;		// ???????????? ?????? ??????
		File file = new File(path);										// ????????? ????????????????????? path??? ?????????????????? ??????
		response.setContentType("application/octet-stream");			// MIME
		
		String header = request.getHeader("User-Agent");
		if (header.contains("MSIE") || header.contains("Trident")) {
			viewFileName = URLEncoder.encode(viewFileName,"UTF-8").replaceAll("\\+", "%20");
        } else {
        	viewFileName = new String(viewFileName.getBytes("UTF-8"), "ISO-8859-1");
        }
        response.setHeader("Content-Disposition", "attachment; filename=\"" + viewFileName + "\"");
        
		try {
			FileInputStream fis=new FileInputStream(file);
			BufferedInputStream bis=new BufferedInputStream(fis);
			ServletOutputStream so=response.getOutputStream();
			BufferedOutputStream bos=new BufferedOutputStream(so);
			byte[] data=new byte[2048];
			int input=0;
			while((input=bis.read(data))!=-1){
				bos.write(data,0,input);
				bos.flush();
			}
			if(bos!=null) bos.close();
			if(bis!=null) bis.close();
			if(so!=null) so.close();
			if(fis!=null) fis.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
	 }
	
	public void closeRoom(String meetingCode) {
		try {
			//liveMapper.closeRoom(paramMap);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public void updateTokenList(String string) {
		try {
			//liveMapper.setStudyWarning(paramMap);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public LiveDto getTokenSelect(int token) {
		LiveDto uDto = new LiveDto();
		try {
			uDto = liveMapper.getTokenSelect(token);
		} catch (Exception e) {
			e.printStackTrace();
		}
 		return uDto;
	}

	public int closeToken(HashMap<String, Object> paramMap) {
		return liveMapper.closeToken(paramMap);
	}
	
	public ArrayList<UserDto> getAttendance(int roomNo) {
		ArrayList<UserDto> studentList = new ArrayList<UserDto>();
		try {
			studentList = liveMapper.getAttendance(roomNo);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return studentList;
	}

	public HashMap<String, Object> getLiveDataList(HashMap<String, Object> paramMap) {
		HashMap<String, Object> returnMap = new HashMap<String, Object>();
		List<LiveDto> liveList = new ArrayList<LiveDto>();
		HashMap<String, Object> lectureData = new HashMap<String, Object>();
		List<HashMap<String, Object>> studentList = new ArrayList<HashMap<String,Object>>();
		try {
			liveList = getOnAirDataList(paramMap);
			
			if(liveList.size() > 0) {
				for(int i = 0; i < liveList.size(); i++) {
					HashMap<String, Object> rowStudentData = new HashMap<String, Object>();
					if(i == 0) {
						lectureData.put("lectureIdx", liveList.get(i).getLectureIdx());			// ????????????
						lectureData.put("broadcastStatus", liveList.get(i).getBroadcastStatus());// ????????????
						lectureData.put("broadcastStDt", liveList.get(i).getBroadcastStDt());	// ??????????????????
						lectureData.put("broadcastEdDt", liveList.get(i).getBroadcastEdDt());	// ??????????????????
						lectureData.put("entryLimit", liveList.get(i).getEntryLimit());			// ??????????????? ???
						lectureData.put("entryCnt", liveList.get(i).getEntryCnt());				// ??????????????????
						lectureData.put("courseIdx", liveList.get(i).getCourseIdx());			// ????????????
						lectureData.put("lectureTitle", liveList.get(i).getLectureTitle());		// ????????????
						lectureData.put("lectureStatus", liveList.get(i).getLectureStatus());	// ????????????(17001:??????  17002:??????  17003:??????  17004:??????)
						lectureData.put("recVodFile", liveList.get(i).getRecVodFile());			// ????????????vod ???????????????
						lectureData.put("recVodLink", liveList.get(i).getRecVodLink());			// ????????????vod ??????
						lectureData.put("vodTitle", liveList.get(i).getVodTitle());				// ???????????????
						lectureData.put("vodType", liveList.get(i).getVodType());				// ??????
						lectureData.put("vodLink", liveList.get(i).getVodLink());				// ???????????????
						lectureData.put("lecturerNo", liveList.get(i).getLecturerNo());			// ????????????
						lectureData.put("courseTitle", liveList.get(i).getCourseTitle());		// ?????????
						lectureData.put("parentVisitFg", liveList.get(i).getParentVisitFg());	// ????????? ?????? ???????????? (1: Yes0: No)
						lectureData.put("operatorIdx", liveList.get(i).getOperatorIdx());		// ??????key
						lectureData.put("operatorFg", liveList.get(i).getOperatorFg());			// ??????
						lectureData.put("operatorId", liveList.get(i).getOperatorId());			// ?????????
						lectureData.put("operatorNm", liveList.get(i).getOperatorNm());			// ??????
						lectureData.put("operatorMobile", liveList.get(i).getOperatorMobile());	// ???????????????
						lectureData.put("operatorEmail", liveList.get(i).getOperatorEmail());	// ?????????
						lectureData.put("adminIdx", liveList.get(i).getAdminIdx());
						lectureData.put("adminId", liveList.get(i).getAdminId());				// ??????/?????? ?????????ID
						lectureData.put("adminNm", liveList.get(i).getAdminNm());				// ??????/?????? ????????????
						lectureData.put("adminYn", liveList.get(i).getAdminYn());				// ??????/?????? ?????????????????????
						if(liveList.get(i).getAdminProfileImg() != null && !"".equals(liveList.get(i).getAdminProfileImg())) {
							lectureData.put("adminProfileImg", modoodaechiUrl+liveList.get(i).getAdminProfileImg());				// ??????/?????? ??????????????????
						} else {
							lectureData.put("adminProfileImg", "/live/img/notUserProfileImg.png");
						}
					}
					
					rowStudentData.put("remoteIdx", liveList.get(i).getRemoteIdx());			// ???????????????
					rowStudentData.put("taskLectureIdx", liveList.get(i).getTaskLectureIdx());	// ????????????????????????
					rowStudentData.put("userIdx", liveList.get(i).getUserIdx());				// key
					rowStudentData.put("userType", liveList.get(i).getUserType());				// ?????? (29001: ??????29002: ?????????)
					rowStudentData.put("userId", liveList.get(i).getUserId());					// ?????????
					rowStudentData.put("userNm", liveList.get(i).getUserNm());					// ??????
					rowStudentData.put("warningsCnt", liveList.get(i).getWarningsCnt());		// ????????????
					
					if(liveList.get(i).getUserProfileImg() != null && !"".equals(liveList.get(i).getUserProfileImg())) {
						rowStudentData.put("userProfileImg", modoodaechiUrl+liveList.get(i).getUserProfileImg());
					} else {
						rowStudentData.put("userProfileImg", "/live/img/notUserProfileImg.png");
					}
					
					studentList.add(rowStudentData);
				}
			} else {
				lectureData.put("reultMsg", "Not Data");
				HashMap<String, Object> rowStudentData = new HashMap<String, Object>();
				rowStudentData.put("reultMsg", "Not Data");
				studentList.add(rowStudentData);
			}
			
			returnMap.put("lectureData", lectureData);
			returnMap.put("studentList", studentList);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return returnMap;
	}

	public List<LiveDto> getOnAirDataList(HashMap<String, Object> paramMap) {
		return liveMapper.getOnAirDataList(paramMap);
	}
//	@Override
//	public UserDto getTokenSelect(int token) throws Exception {
//		// TODO Auto-generated method stub
//		return null;
//	}

	public String startOnair(HashMap<String, Object> paramMap) {
		int result = 0;
		String flg = "N";
		try {
			result += setOnAirStatus(paramMap);
			result += setStartOnair(paramMap);
			
			if(result > 0) {
				flg = "Y";
			}
			
			// ??????????????? ????????????????????? ????????? ????????? ?????? ????????? ??????
			String broadcastStatus = (String) paramMap.get("broadcastStatus");
			if(flg.equals("Y") && broadcastStatus.equals("24003")) {
				setSjw1_8847_1(paramMap);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return flg;
	}

	@Override
	public int setStartOnair(HashMap<String, Object> paramMap) {
		return liveMapper.setStartOnair(paramMap);
	}

	@Override
	public int setOnAirStatus(HashMap<String, Object> paramMap) {
		return liveMapper.setOnAirStatus(paramMap);
	}

	public int insertAttendance(HashMap<String, Object> paramMap) {
		int returnVal = 0;
		int attendIdx = 0;
		try {
			System.out.println(paramMap);
			attendIdx = getAttendIdx(paramMap); 
			System.out.println(attendIdx);
			
			if (attendIdx == 0) {
				returnVal = liveMapper.insertAttendance(paramMap);
			} else {
				returnVal = -1;
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return returnVal;
	}
	
	@Override
	public int getAttendIdx(HashMap<String, Object> paramMap) {
		return liveMapper.getAttendIdx(paramMap);
	}

	@Transactional
	public void setStudyWarning(Map<String, Object> paramMap) {
		System.out.println("[????????????] : " + (String) paramMap.get("warningType"));

		HashMap<String, Object> resultMap = new HashMap<String, Object>();
		int studentIdx = 0;
		try {
			// ?????????????????? ??????
			resultMap = liveMapper.getStudentIdx(paramMap);
			studentIdx = (resultMap.get("studentIdx") == null)? 0 : (int) resultMap.get("studentIdx");
			
			// ??????, ????????????, ???????????? ??????
			resultMap = liveMapper.getOnairLecture(paramMap);
			
			if (resultMap.get("course_idx") == null || "".equals(resultMap.get("course_idx"))) {
				// ???????????? ????????? ???????????? ??????????????? ??????
				paramMap.put("resultCode", "20");
				paramMap.put("resultMessage", "?????? ??????????????? ????????? ????????????.");
			} else if (studentIdx == 0) {
				// ???????????? ????????? ???????????? ??????????????? ??????
				paramMap.put("resultCode", "30");
				paramMap.put("resultMessage", "?????? ???????????? ????????? ????????????.");
			} else {
				paramMap.put("studentIdx", studentIdx);
				paramMap.put("courseIdx", resultMap.get("course_idx"));
				paramMap.put("lectureIdx", resultMap.get("lecture_idx"));
				paramMap.put("lectureNumber", resultMap.get("lecture_number"));
				
				// ???????????????????????? ??????
				int takeCourseIdx = 0;
				int taskLectureIdx = 0;
				int warningsCnt = 0;
				resultMap = liveMapper.getStudentTakeCourse(paramMap);

				takeCourseIdx = (resultMap.get("take_course_idx") == null)? 0 : (int) resultMap.get("take_course_idx");
				taskLectureIdx = (resultMap.get("task_lecture_idx") == null)? 0 : (int) resultMap.get("task_lecture_idx");
				warningsCnt = (resultMap.get("warning_cnt") == null)? 1 : ((Long) resultMap.get("warning_cnt")).intValue();
				
				if(takeCourseIdx == 0) {
					// ?????????????????? ????????? ???????????? ??????????????? ??????
					paramMap.put("resultCode", "40");
					paramMap.put("resultMessage", "?????? ????????? ??????????????? ????????? ????????????.");
				} else if(taskLectureIdx == 0) {
					// ?????????????????? ????????? ???????????? ??????????????? ??????
					paramMap.put("resultCode", "50");
					paramMap.put("resultMessage", "?????? ????????? ??????????????? ????????? ????????????.");
				} else {
					paramMap.put("takeCourseIdx", takeCourseIdx);
					paramMap.put("taskLectureIdx", taskLectureIdx);
					paramMap.put("warningsCnt", warningsCnt);
					String chatWarningType = (String) paramMap.get("warningType");
					int updateLectureWarningCnt = 0;
					
					if (!chatWarningType.equals("D")) {
						updateLectureWarningCnt = updateLectureWarningsCnt(paramMap);
					}
					
					if(updateLectureWarningCnt == 0 && !chatWarningType.equals("D")) {
						// ?????????????????? ????????? ???????????? ????????? ???????????? ??????????????? ??????
						paramMap.put("resultCode", "90");
						paramMap.put("resultMessage", "?????? ??????????????? ?????? ???????????????. :: ??????????????????????????????");
					} else {
						// LMS?????? ???????????? ?????? ???????????? ??????
						String warningType = "32001";
						if(warningsCnt == 1) { 
							warningType = "32001";
						} else if(warningsCnt == 2) { 
							warningType = "32002";
						} else if(warningsCnt >= 3) { 
							warningType = "32003";
						}
						
						paramMap.put("warningType", warningType);

						// [START] ??????????????? ????????????('A') ?????? ????????????('R')????????? ???????????? ??????????????????
						/*
						 *	???????????? ???????????? ???????????? LMS????????? ??????
						 *	??????		DB		??????
						 *	S		47001	??????
						 *	A		47002	????????????
						 *	P		47003	??????????????????
						 *	D		47004	????????????
						 *	E		47005	??????
						 */
						if(chatWarningType.equals("S")) {
							paramMap.put("warningReason", LiveConstant.WARNING_SLEEP);
						} else if(chatWarningType.equals("A")) {
							paramMap.put("warningReason", LiveConstant.WARNING_AWAY);
						} else if(chatWarningType.equals("P")) {
							paramMap.put("warningReason", LiveConstant.WARNING_PHONE);
						} else if(chatWarningType.equals("D")) {
							paramMap.put("warningReason", LiveConstant.WARNING_DROP_OUT);
						} else if(chatWarningType.equals("E")) {
							paramMap.put("warningReason", LiveConstant.WARNING_ETC);
						}

						resultMap = getWarningAttendIdx(paramMap);
						
						int statusCnt = 0;
						if (resultMap != null) {
							int attendIdx = (resultMap.get("attend_idx") == null)? 0 : (int) resultMap.get("attend_idx");
							paramMap.put("attendIdx", attendIdx);
//							if( ("A".equals(chatWarningType) || "D".equals(chatWarningType)) && attendIdx > 0 ) {
							if( "A".equals(chatWarningType) && attendIdx > 0 ) {
								updateAttendanceStatus(paramMap);
							}
						}
						// [END] ??????????????? ????????????('A') ?????? ????????????('R')????????? ???????????? ??????????????????
						
						int insertWarningLogCnt = insertStudyWarningLog(paramMap); // ?????? ??????
						
						/*
						 * ?????? 3??????????????? ?????? ??????????????? ????????? ??????
						 */
						if(warningsCnt >= 3 && !chatWarningType.equals("D")) {
//							setSjw1_8869_1((HashMap<String, Object>) paramMap); 2021-07-06 ????????? ????????????
						}

						// ???????????? ????????? ??????
						if(chatWarningType.equals("D")){
//							setSjw1_9760_1((HashMap<String, Object>) paramMap); 2021-07-06 ????????? ????????????
						}
						
						if(insertWarningLogCnt == 0) {
							paramMap.put("resultCode", "90");
							paramMap.put("resultMessage", "?????? ??????????????? ?????? ???????????????. :: ??????????????????");
						} else {
							paramMap.put("resultCode", "00");
							paramMap.put("resultMessage", "Success");
						}
					}
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}




	public HashMap<String, Object> getStudentIdx(Map<String, Object> paramMap){
		return liveMapper.getStudentIdx(paramMap);
	}
	
	public HashMap<String, Object> getOnairLecture(Map<String, Object> paramMap){
		return liveMapper.getOnairLecture(paramMap);
	}
	
	public HashMap<String, Object> getStudentTakeCourse(Map<String, Object> paramMap){
		return liveMapper.getStudentTakeCourse(paramMap);
	}
	
	public HashMap<String, Object> getWarningAttendIdx(Map<String, Object> paramMap){
		return liveMapper.getWarningAttendIdx(paramMap);
	}
	
	public int updateLectureWarningsCnt(Map<String, Object> paramMap) {
		int resultCnt = 0;
		try {
			resultCnt = liveMapper.updateLectureWarningsCnt(paramMap);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return resultCnt;
	}
	
	public int updateAttendanceStatus(Map<String, Object> paramMap) {
		int resultCnt = 0;
		try {
			resultCnt = liveMapper.updateAttendanceStatus(paramMap);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return resultCnt;
	}
	
	public int insertStudyWarningLog(Map<String, Object> paramMap) {
		int resultCnt = 0;
		try {
			resultCnt = liveMapper.insertStudyWarningLog(paramMap);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return resultCnt;
	}

	public void regToken() {
		try {
			liveMapper.regToken();
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}

	public String getTokenIdString() {
		try {
			regToken();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return liveMapper.getTokenIdString();
	}

	@Override
	public List<HashMap<String, Object>> tokenList() {
		return liveMapper.tokenList();
	}
	
	@Override
	public void resetOnAirData() {
		liveMapper.resetOnAirData();
	}

	@Override
	public void updateOnairStudentCnt(HashMap<String, Object> paramMap) {
		liveMapper.updateOnairStudentCnt(paramMap);
		
	}
	
	/*
	 * ?????????????????????
	 * setSjw1_8847_1 : ??????????????? ???????????? ???????????? ??????
	 * setSjw1_8869_1 : ??????3??? ??????????????? ??????????????? ????????? ??????
	 * setSjw1_9760_1 : ???????????? ????????? ??????
	 * setSjw1_9758_1 : ????????? ?????? ????????? ??????
	 * setSjw1_9764_1 : ?????? ????????? ??????
	 */
	@Override
	public void setSjw1_8847_1(HashMap<String, Object> paramMap) {
		liveMapper.setSjw1_8847_1(paramMap);
	}

	@Override
	public void setSjw1_8869_1(HashMap<String, Object> paramMap) {
		liveMapper.setSjw1_8869_1(paramMap);
	}

	@Override
	public void setSjw1_9760_1(HashMap<String, Object> paramMap) {
		liveMapper.setSjw1_9760_1(paramMap);
	}

	@Override
	public int setSjw1_9758_1(HashMap<String, Object> paramMap) {
		return liveMapper.setSjw1_9758_1(paramMap);
	}

	@Override
	public int setSjw1_9764_1(HashMap<String, Object> paramMap) {
		return liveMapper.setSjw1_9764_1(paramMap);
	}
}