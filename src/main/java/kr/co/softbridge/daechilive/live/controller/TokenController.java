package kr.co.softbridge.daechilive.live.controller;

import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import kr.co.softbridge.daechilive.live.dto.LiveDto;
import kr.co.softbridge.daechilive.live.dto.TokenDto;
import kr.co.softbridge.daechilive.live.dto.UserDto;
import kr.co.softbridge.daechilive.live.mapper.LiveMapper;
import kr.co.softbridge.daechilive.live.service.LiveService;

@Controller
public class TokenController {

	@Autowired(required = false)
	private LiveMapper liveMapper;

	@Autowired(required = false)
	private LiveService liveService;

	@Value("${daechilive.contServ.media}")
	private String mediaUrl;

	@Value("${daechilive.contServ.chat}")
	private String chatUrl;

	@RequestMapping(value = "join")
	public String joinToken(@RequestParam HashMap<String, Object> paramMap, HttpServletRequest request,
			HttpServletResponse response, Model model) throws Exception {
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
		
		int token = Integer.parseInt(request.getParameter("token"));
		LiveDto getTokenData = liveService.getTokenSelect(token); // 서비스명;

		// 분기시 방번호, 회원번호를 해당 URL로 model에 담아서 전송
		HashMap<String, Object> rtnMap = new HashMap<String, Object>();
		// 1. 전달받은 token id로 통큰정보 조회
		/* 토큰정보가 있으면 토큰정보 만료시킨다 */
		if (getTokenData != null) {
			paramMap.put("tokenIdx", token); 
			liveService.closeToken(paramMap);

			if (getTokenData.getTokenUserType().equals("0")) {
				model.addAttribute("userLevel", "1001");
			} else if (getTokenData.getTokenUserType().equals("1")) {
				model.addAttribute("userLevel", "1002");
			} else if (getTokenData.getTokenUserType().equals("2") || getTokenData.getTokenUserType().equals("3")) {
				model.addAttribute("userLevel", "2001");
			}

			/* Gate페이지에 전달값을 MODEL에 담는다. */
			model.addAttribute("onairIdx", getTokenData.getOnairIdx());
			model.addAttribute("userKey", getTokenData.getUserKey());
			model.addAttribute("tokenUserType", getTokenData.getTokenUserType());
			model.addAttribute("onairType", getTokenData.getOnairType());
		}

		return "live/liveGate";
	}
	
	@RequestMapping(value = "regTest")
	public void regTest(
			@RequestParam HashMap<String, Object> paramMap
			, HttpServletRequest request
			, HttpServletResponse response
			, Model model) throws Exception {
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
		
		String resultString = liveService.getTokenIdString();
		
		PrintWriter out = response.getWriter(); 
		response.setContentType("text/html; charset=utf-8");
		out.print("<html><body><h2>" + resultString + "</h2></body></html>");
		out.flush(); 
	}
	
	@RequestMapping(value = "tokenList")
	public void tokenList(
			@RequestParam HashMap<String, Object> paramMap
			, HttpServletRequest request
			, HttpServletResponse response
			, Model model) throws Exception {
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
		
		List<HashMap<String, Object>> resultList = liveService.tokenList();
		
		PrintWriter out = response.getWriter(); 
		response.setContentType("text/html; charset=utf-8");
		StringBuffer sb = new StringBuffer();
		sb.append("<html><body><h2>토큰리스트<h2>");
		sb.append("<ul>");
		if(resultList.size() > 0) {
			for(int i = 0; i < resultList.size(); i++) {
				HashMap<String, Object> resultMap = resultList.get(i);
				sb.append("<li>");
				sb.append("토큰번호 : "+ resultMap.get("tokenIdx"));
				sb.append("\t방송번호 : "+ resultMap.get("onairIdx"));
				sb.append("\t사용자유형 : "+ resultMap.get("userType"));
				sb.append("\t만료여부 : "+ resultMap.get("expYn"));
				if("사용가능".equals(resultMap.get("expYn"))) {
					sb.append("\t<a href='/join?token="+resultMap.get("tokenIdx")+"'>접속</a>");
				} else {
					sb.append("\t");
				}
				sb.append("</li>");
			}
		}
		sb.append("</ul></body></html>");
		out.print(sb.toString());
		out.flush(); 
	}
	
	@RequestMapping(value = "resetToken")
	public void resetToken(
			@RequestParam HashMap<String, Object> paramMap
			, HttpServletRequest request
			, HttpServletResponse response
			, Model model) throws Exception {
		response.setCharacterEncoding("UTF-8");
		response.setContentType("text/html; charset=UTF-8");
		
		liveService.resetOnAirData();
		
		PrintWriter out = response.getWriter(); 
		response.setContentType("text/html; charset=utf-8");
		out.print("<html><body><h2>Token정보가 모두 초기화 되었습니다.</h2></body></html>");
		out.flush(); 
	}
}