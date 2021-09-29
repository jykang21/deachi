package kr.co.softbridge.daechilive.vod.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/vod")
public class VodController {
    @RequestMapping(value = "/test")
    public String adminLoginForm(HttpServletRequest request) {
        return "vod/player1_full";
    }
}
