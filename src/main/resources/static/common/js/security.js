/* 개발 진행 임시 주석
// 잘못된 경로 진입 방지
let prvUrl = document.referrer;
if(prvUrl == "")
{
    alert("잘못된 경로에서의 진입입니다.");
    location.href = "/index.html";
}
*/

// F12 버튼 방지
$(document).ready(function(){
    $(document).bind('keydown',function(e){
        if ( e.keyCode == 123 /* F12 */) {
            e.preventDefault();
            e.returnValue = false;
        }
    });
});

// 우측 클릭 방지
document.onmousedown=disableclick;
status="마우스 오른쪽 클릭을 할수 없습니다.";

function disableclick(event){
    if (event.button==2) {
        alert(status);
        return false;
    }
}

// 새로고침 방지
let retUrl;
$(document).keydown(function(e) {
	if(userLevel == '1001') {
	    //retUrl = "/admin/login";
	} else {
	    retUrl = "/";
		/*retUrl = "/login";
		if(room_number) {
			retUrl += "?meeting_code=" + room_number;
		}*/
	}
    if (e.keyCode == 116 || e.ctrlKey == true  && (e.keyCode == 82 || e.keyCode == 78 || e.keyCode == 8) ){
        e.preventDefault();
        if (confirm("새로고침을 할 경우 로그인 페이지로 이동합니다.\n새로고침 하시겠습니까?")) {
            window.location.href = retUrl;
        } else {
            return false;
        }
    }
});

// XSS
function encXssMsg(str) {
    str = str.replaceAll("<", "&lt;");
    str = str.replaceAll(">","&gt;");
    str = str.replaceAll("&","&amp;");
    str = str.replaceAll("\"","&quot;");
    str = str.replaceAll("'","&#x27;");
    str = str.replaceAll("/","&#x2F;");
    str = str.replaceAll("(","&#40;");
    str = str.replaceAll(")","&#41;");
    return str;
}

function decXssMsg(str) {
    str = str.replaceAll("&lt;","<");
    str = str.replaceAll("&gt;",">");
    str = str.replaceAll("&amp;","&");
    str = str.replaceAll("&quot;","\"");
    str = str.replaceAll("&#x27;","'");
    str = str.replaceAll("&#x2F;","/");
    str = str.replaceAll("&#40;","(");
    str = str.replaceAll("&#41;",")");
    return str;
}

(function(){ // 외부 라이브러리와 충돌을 막고자 모듈화.
	// 브라우저 및 버전을 구하기 위한 변수들.
	'use strict';
	var agent = navigator.userAgent.toLowerCase(),
		name = navigator.appName,
		browser;

	// MS 계열 브라우저를 구분하기 위함.
	if(name === 'Microsoft Internet Explorer' || agent.indexOf('trident') > -1 || agent.indexOf('edge/') > -1) {
		browser = 'ie';
		if(name === 'Microsoft Internet Explorer') { // IE old version (IE 10 or Lower)
			agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec(agent);
			browser += parseInt(agent[1]);
		} else { // IE 11+
			if(agent.indexOf('trident') > -1) { // IE 11
				browser += 11;
			} else if(agent.indexOf('edge/') > -1) { // Edge
				browser = 'edge';
			}
		}
	} else if(agent.indexOf('safari') > -1) { // Chrome or Safari
		if(agent.indexOf('opr') > -1) { // Opera
			browser = 'opera';
		} else if(agent.indexOf('chrome') > -1) { // Chrome
			browser = 'chrome';
		} else { // Safari
			browser = 'safari';
		}
	} else if(agent.indexOf('firefox') > -1) { // Firefox
		browser = 'firefox';
	}

	// IE: ie7~ie11, Edge: edge, Chrome: chrome, Firefox: firefox, Safari: safari, Opera: opera
	document.getElementsByTagName('html')[0].className = browser;
}());