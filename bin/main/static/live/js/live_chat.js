$(document).ready(function () {
	// console.log('roomNo', roomNo, 'userId', userId, 'managerId', managerId)
	$.ajax({
    	url: 'https://mdchat.sobro.co.kr:4000/GetChatInfo',
        data: {roomNo: roomNo, userId: userId, managerYn: (userId == managerId) ? "Y" : "N"},
        type: 'POST',
		dataType: 'json',
        success: function (data) {
			CHAT_URL = "https://"+data.DOMAIN+":"+data.PORT
			console.log('CHAT_URL',CHAT_URL);
			socket = io.connect(CHAT_URL, {
			    'reconnect': true,
			    'reconnection delay': 500,
			    'reopen delay': 500,
			    'max reconnection attempts': 10
			});
			let connectFlag = false;
			socket.on('connect', function(){
				console.log('connect');
				joinRoom();

				// 채팅 서버 재기동으로 인한 클라이언트 재접속 시 이벤트 바인딩 최초 한번만 받을 수 있도록 예외처리.
				if(connectFlag)
					return;
				connectFlag = true;

				socket.on('rep-modootest', function (data) {
					//console.log('응답 : rep-modootest',data);
				});

				socket.on('disconnect', function() {
					console.log('disconnect');
				});

				socket.on('notify-close-meeting', function (data) {
					// console.log('응답 : notify-close-meeting',data);
					if(data.RESULT == 'Y') {
						if (userLevel == "1001" || userLevel == "1002") {
							closeInsertDB();
						} else if (userLevel == "2001") {
							socket.close();
							location.href = "/live/roomexit"; // 페이지 이동 처리
							// $("#closeCaption").show();
							// $(".rel").css("position", "relative");
						}
					}else if(data.RESULT == 'N') {
						if (userLevel == "1001" || userLevel == "1002") {
							window.open('','_self').close();
						}
					}
				});

				socket.on('notify-RoomUserCount', function (data) {
					console.log('응답 : notify-RoomUserCount - n명이 공부',data.UsrCount);
					let virtualUser = 20; // 용컴 요청사항 가상사용자 20명 추가
					virtualUser += data.UsrCount;
					currStudentCnt = virtualUser;
					if(userLevel == 1001) {
						setOnairStudentCnt(currStudentCnt);
					}
					document.querySelector('.masthead_state.maincolor1').innerHTML = "지금 "+currStudentCnt+"명이 함께 공부하고 있어요";
				});

				socket.on('refresh-ChatMsg', function (data) {
					// console.log('응답 : refresh-ChatMsg');
					if(data == "DONE") {
						if(userLevel != "2001") {
							$("#notice").empty();
						}
						$("#chat").empty();
					}
				});

				let seqCheck = 0;
				socket.on('notify-ChatMsg', function (data) {
					if(seqCheck < data.seq){
						seqCheck = data.seq;
					}else{
						return;
					}

					if(userLevel == 2001) {
						toStudentID = userId;
					}
				    // 학생 채팅 카운트 증가
					// data : 이 방의 모든 채팅
					if("A" == data.msgType || "AF" == data.msgType || toStudentID == data.fromID || toStudentID == data.toID){
						chatChage(toStudentID, data);

						// 전체화면일때 채팅 알림
						if(userLevel == 2001 && fullscrenFlag){
							$("#fullChatalert").css('display','block');
							if($("#fullChatalert").hasClass("off")) {
								$("#fullChatalert").removeClass("off");
							}
							$("#fullChatalert span").text(++fullscrenChatCnt);
							setTimeout(function () {
								$(".chat_alert").addClass('off');
							},2000);
						}

					} else {
						if(joinNext) {
							let count = 0;
							let uIdx = uChatCnt.findIndex(function(item) {return item.userId == data.fromID});
							if(uIdx > -1) {
								count = uChatCnt[uIdx].chatCnt;
								count++;
								uChatCnt[uIdx] = {userId: data.fromID, chatCnt: count};
							} else {
								count++;
								uChatCnt.push({userId: data.fromID, chatCnt: count});
							}

							if($("#userremote"+getIDRemoteIdx(data.fromID)) && count > 0){
								if($("#userremote"+getIDRemoteIdx(data.fromID)).find(".message_ic").length > 0){
									$("#userremote"+getIDRemoteIdx(data.fromID)).find(".message_ic").text(count);
								}else{
									let msgCntHtml = '<span class="message_ic">'+count+'</span>';
									$("#userremote"+getIDRemoteIdx(data.fromID)).find('.surf_feed').append(msgCntHtml);
									$("#userremote"+getIDRemoteIdx(data.fromID)).find(".message_ic").text(count);
								}
							}
							$("#userremote"+getIDRemoteIdx(data.fromID)).find(".message_ic").show();
							$("#userremote"+getIDRemoteIdx(data.fromID)).find(".surf_feed").show();


							// if($("."+data.fromID) && count > 0) {
							// 	// if($("."+data.fromID).parents('.surface').find(".message_ic").length > 0) {
							// 	// 	$("."+data.fromID).parents('.surface').find(".message_ic").text(count);
							// 	// }
							//
							// 	// if($("."+data.fromID).parents('.surface').find(".message_ic").length  < 1){
							// 	// 	let msgCntHtml = '<span class="message_ic">'+chatCount(count)+'</span>';
							// 	// 	$("."+data.fromID).parents('.surface').find('.surf_feed').append(msgCntHtml);
							// 	// 	$("."+data.fromID).parents('.surface').find(".message_ic").text(count);
							// 	// 	$("."+data.fromID).parents('.surface').find(".message_ic").show();
							// 	// }
							//
							// 	if($("."+data.fromID).parents('.surface').find(".message_ic").length > 0) {
							// 			$("."+data.fromID).parents('.surface').find(".message_ic").text(count);
							//
							// 			console.log('IFIFIFFIFI');
							// 	}else {
							// 		// let surfFeedHtml = '<span class="message_ic">'+count+'</span>'
							// 		// 					+ $("."+data.fromID).parents('.surface').find('.surf_feed').html();
							//
							// 		let msgCntHtml = '<span class="message_ic">'+count+'</span>';
							// 		$("."+data.fromID).parents('.surface').find('.surf_feed').append(msgCntHtml);
							// 		$("."+data.fromID).parents('.surface').find(".message_ic").text(count);
							//
							// 		console.log('getIDRemoteIdx',getIDRemoteIdx(data.fromID));
							// 		console.log('ELELELELEL');
							// 	}
							// 	$("."+data.fromID).parents('.surface').find(".message_ic").show();
							// 	$("."+data.fromID).parents('.surface').find('.surf_feed').show();
							// }
						}
					}
				});

				socket.on('history-ChatMsg', function (data) {
					if(seqHisChatCheck < data.seq){
						seqHisChatCheck = data.seq;
					}else{
						return;
					}
					if(userLevel != 2001) {
						//toStudentID = userId;
				    	chatChage(toStudentID, data);
					}
				});

				socket.on("rep-mute-meeting", function(data){
					if(userLevel == 2001 && data.MUTE == 'Y'){
						toggleAudioVal = 'OFF';
						videoDevice.toggleDeviceAudio(onlocal, toggleAudioVal);
					}
				});

				socket.on("rep-question-study", function(data){
					// console.log('응답 : rep-question-study - 질문');
					setQuestion(data);
				});

				socket.on("rep-question-list", function(data){
					// console.log('응답 : rep-question-list - 질문 리스트');
					if(userLevel == 2001) {
						if (data.length > 0)  {
							data.forEach(function (forData) {
								if(forData.UserLevel == userLevel){
									setQuestionState(forData);
								}
							});
						}
					}else {
						if (data.length > 0) {
							data.forEach(function (forData) {
								if(forData.UserLevel == userLevel){
									setQuestion(forData);
								}
							});
						}
					}
				});

				let seqUnderCheck = 0;
				socket.on("rep-understand-study",function(data){
					if(seqUnderCheck < data.SEQ){
						seqUnderCheck = data.SEQ;
					}else{
						return;
					}


					understandTotalCount += data.GOOD;
					misUnderstandTotalCount +=data.BAD;
					if(understandTotalCount < 0)
						understandTotalCount = 0;
					if(misUnderstandTotalCount < 0)
						misUnderstandTotalCount = 0;

					if(understandTotalCount==0){
						$("#yesBtn span").text("");
					}else{
						$("#yesBtn span").text(understandTotalCount);
					}
					if(misUnderstandTotalCount == 0){
						$("#noBtn span").text("");
					}else{
						$("#noBtn span").text(misUnderstandTotalCount);
					}
				});

				socket.on("rep-stopwatch",function(data){
					// console.log('응답 : rep-stopwatch - 타이머');
					if(data.FLAG == 'S'){
						let nowTime = showNowTime();
						let stTime = procSec(data.START_TIME.substring(0,2), data.START_TIME.substring(2,4), data.START_TIME.substring(4,6));
						let time = procSec(data.TIME.substring(0,2), data.TIME.substring(2,4), data.TIME.substring(4,6));
						let nowSec = procSec(nowTime.substring(0,2), nowTime.substring(2,4), nowTime.substring(4,6));
						let realSec = stTime + time - nowSec;
						let realTime = sectoTime(realSec);
						let shour = realTime.substring(0,2);
						let smin = realTime.substring(2,4);
						let ssec = realTime.substring(4,6);
						setTimer(shour, smin, ssec);
					} else if(data.FLAG == 'E'){
						closeTimer('chat');
					}
				});

				socket.on("rep-warn-study",function(data){
					// console.log('응답 : ep-warn-study - 경고');
					let result = 0;
					let stdIdx = studentList.findIndex(function(item){
						return item.userId == data.ID;
					});
					result = studentList[stdIdx].warningsCnt+1;
					studentList[stdIdx].warningsCnt = result;
					// 학생에게
					if(userLevel == "2001"){
						if(userId == data.ID){
							if(data.COUNT == 1 ) {
								$("#userName").children("i").remove();
								$("#userName").append("<i class='warn w1'></i>");
							} else if(data.COUNT == 2) {
								$("#userName").children("i").remove();
								$("#userName").append("<i class='warn w2'></i>");
							} else if(data.COUNT >= 3) {
								$("#userName").children("i").remove();
								$("#userName").append("<i class='warn w3'></i>");
							}
						}
					// 강사가 경고날리면 조교에게 / 조교가 경고날리면 강사에게
					}else if(userLevel == "1001" || userLevel == "1002"){
						// 경고 n 회 표시
						if(data.COUNT > 0){
							$(".urer_warn").text("경고"+data.COUNT+"회");
						} else {
							$(".urer_warn").text("");
						}
						// 학생 이름옆에 경고 동그라미 표시
						if(data.COUNT == 1){
							$("div.surf_rsl").children("video."+data.ID).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
							$("div.surf_rsl").children("video."+data.ID).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w1'></i>");
						}else if(data.COUNT == 2){
							$("div.surf_rsl").children("video."+data.ID).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
							$("div.surf_rsl").children("video."+data.ID).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w2'></i>");
						}else if(data.COUNT >= 3){
							$("div.surf_rsl").children("video."+data.ID).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
							$("div.surf_rsl").children("video."+data.ID).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w3'></i>");
						}
					}
				});

				socket.on("rep-examination",function(data){
					console.log('응답 : rep-examination - 시험정보');
					if(data == null)
						return;
					if(data.examYn == 'Y'){
						if(userLevel == "2001"){
							console.log('학생시험 레이어팝업 호출');
							// 학생시험 레이어팝업 호출
							popupExam(data);
						}else if(userLevel == "1001" || userLevel == "1002"){
							// 강사/조교 시험타이머 호출
							popupExamTimer(data);
						}
					} else if(data.examYn == 'N'){
						// 강사/조교 타이머 종료되지 않은경우 종료
					}
				});

				// 요청한 사람에게만 응답받는 시험상태 정보 패킷
				socket.on("rep-examination-status",function(data){
					console.log('응답 : rep-examination-status - 시험중확인');
					console.log('응답 : rep-examination-status - data',data);
					if(data == null || data.examYn == 'N'){
						if(userLevel == "2001"){
							$("#enterinfo_pop").show();
						}
						return;
					}else if(data.examYn == 'Y') {
						if (userLevel == "2001") {
							// 학생시험 레이어팝업 호출
							popupExam(data);
							setTimeout(function () {
								$("#enterinfo_pop").show(); // 2초뒤 팝업
							}, 2000);
						} else if (userLevel == "1001" || userLevel == "1002") {
							// 강사/조교 시험타이머 호출
							popupExamTimer(data);
						}
					}
				});

				// 강의 시작 알림
				socket.on("notify-Lecture-start",function(data){
					// console.log('응답 : notify-Lecture-start - 강의시작');
					if(userLevel == "1001" || userLevel == "1002"){
						$('.player_start').hide();
						lectureData.broadcastStatus = '24003';
						lectureData.lectureStatus = '17002';
					}
				});
			});
        },
        error: function (data) {
             // console.log(data)
        }
	});
});

// 시험지 띄우기
function popupExam(data){
	let url = LMS_URL+'/exam/examTakePop?taskLectureIdx=' + studentList[0].taskLectureIdx + '&lectureExamIdx=' + data.lectureExamIdx+ '&exmaNo=' + data.lecturerNo;
	// let url = '/live/roomexit';
	$('#examScreen').attr('src', url);
	$("#examScreen").show();
}

// 강사&조교 타이머
function popupExamTimer(data){
	$('.player_exam_timer').show();
	setTimer_exam(data);
}

// 강의종료 DB에 넣기
function closeInsertDB() {
	if(userLevel == 1001 || userLevel == 1002){
		// DB강의상태 update(ajax)
		$.ajax({
			url :'setStartOnair',
			type : 'post',
			dataType : 'text',
			data : {
				onairIdx : roomNo,
				lectureIdx : lectureData.lectureIdx,
				broadcastStatus : '24004',
				lectureStatus : '17004'
			},
			success: function () {
				$('#exitRoom').hide();
				alert('강의가 종료되었습니다');
				window.open('about:blank','_parent').parent.close();
			},
			error : function(request, status, errorThrown) {
				alert('권한이 없거나 문제가 발생하여 강의를종료 할 수 없습니다.\n관리자에게 문의해주세요.');
			}
		});
	}
}


function chatHtml(chatClass, fromNick, sendTime, changedMsgStr, recvData, fileUse, clickEvent="") {
	let imgSrc;
	if(recvData.fromLevel == 1001){
		imgSrc = lectureData.adminProfileImg;
	}else if(recvData.fromLevel == 1002){
		imgSrc = "/live/img/test_img1.png"; // 조교공통이미지
	}else if(recvData.fromLevel == 2001){
		imgSrc = studentProfImg(recvData.fromID);
	}

	let html;
	if(fileUse == "Y"){
		if(chatClass == "my"){
			html = '<div class="chat_box '+chatClass+'">' +
				'<div class="chat_user">' +
				'<div class="urer_time">'+ sendTime +'</div>' +
				'</div>' +
				'<div class="chat_line file" onclick="'+clickEvent+'">'+ changedMsgStr +'</div>' +
				'</div></div>';
		}else{
			html = '<div class="chat_box '+chatClass+'">' +
				'<div class="chat_user">' +
				'<div class="user_thumb normal"><span><img src=' + imgSrc + '></span></div>' +
				'<div class="user_name">'+ fromNick +'</div>' +
				'<div class="urer_time">'+ sendTime +'</div>' +
				'</div>' +
				'<div class="chat_line file" onclick="'+clickEvent+'">'+ changedMsgStr +'</div>' +
				'</div></div>';
		}
	}else{
		if(chatClass == "my"){
			html = '<div class="chat_box '+chatClass+'">' +
				'<div class="chat_user">' +
				'<div class="urer_time">'+ sendTime +'</div>' +
				'</div>' +
				'<div class="chat_line">'+ changedMsgStr +'</div>' +
				'</div></div>';
		}else{
			html = '<div class="chat_box '+chatClass+'">' +
				'<div class="chat_user">' +
				'<div class="user_thumb normal"><span><img src=' + imgSrc + '></span></div>' +
				'<div class="user_name">'+ fromNick +'</div>' +
				'<div class="urer_time">'+ sendTime +'</div>' +
				'</div>' +
				'<div class="chat_line">'+ changedMsgStr +'</div>' +
				'</div></div>';
		}
	}

	return html;
}

//학생 채팅선택
function chatChage(targetId, data){
	let chatClass = '';
	let sendTime = '';
	if (data.time) {
		const receivedTime = data.time;
		let [hour, min] = receivedTime.split(':');
		// 시간
		if(hour) {
			if (hour >= 12) {
				sendTime = '오후 ';
				if(hour > 12) {
					hour = `${hour - 12}`;
				}
			} else {
				sendTime = '오전 ';
			}
			if(hour.length < 2) {
				sendTime += `0${hour}:`;
			} else {
				sendTime += `${hour}:`;
			}
		}
		// 분
		if(min) {
			if(min.length < 2) {
				sendTime += `0${min}`;
			} else {
				sendTime += `${min}`;
			}
		}
	}
	
	if(data.fromID == userId){
		chatClass="my";
	}

	let chatMsgStr = decodeURI(data.message).replace(/\n/g, '<br>');
	chatMsgStr = decXssMsg(chatMsgStr);
	let changedMsgStr;
	var expUrlH = /(\b(http[s]?|ftp):\/\/(www\.)?[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	var changedH = chatMsgStr.replace(expUrlH, '<a href="$1" target="_blank">$1</a>').replace('<br>', '');
	var expUrlW = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	var changedW = chatMsgStr.replace(expUrlW, '<a href="http://$2" target="_blank">$2</a>').replace('<br>', '');
	if(changedW.indexOf("<a") > -1) {
		changedMsgStr = changedW;
	} else {
		changedMsgStr = changedH;
	}
	
	if(data.msgType == "A"){
		if(userLevel == 1001 || userLevel == 1002) {
			createHtml = chatHtml((data.fromID == userId)?"my":"", data.fromNick, sendTime, changedMsgStr, data);
			$("#notice").append(createHtml);
			$("#chat").append(createHtml);
		}else{
			createHtml = chatHtml("", data.fromNick, sendTime, changedMsgStr, data);
			$("#chat").append(createHtml);
		}

	} else if(data.msgType == "U") {
		let rs = ClevisURL.collect(chatMsgStr);
		
		if(rs.length > 0) {
			let replaceUrl = chatMsgStr;
			rs.forEach(function (data, idx) {
				let space = "";	
				data = data.replace(/&/g, '&amp;');
				
				if (idx > 0) {
					space = '<br>';
				}
				replaceUrl = replaceUrl.replace(data, space + '<a href="javascript:window.open(\''+data+'\')" style="color:#fff">'+ data +'</a>');						
			});
			createHtml = chatHtml(chatClass, data.fromNick, sendTime, replaceUrl, data);
		} else {
			createHtml = chatHtml(chatClass, data.fromNick, sendTime, chatMsgStr, data);
		}
		if(targetId ==  data.fromID || targetId ==  data.toID) {
			$("#chat").append(createHtml);
		}
	} else if(data.msgType == "UF") {
		let proomNo = changedMsgStr.split("|")[0];
		let pseq = changedMsgStr.split("|")[1];
		let viewFileName = changedMsgStr.split("|")[2];
		let clickEvent = "downloadFile("+proomNo+", "+pseq+", '"+viewFileName+"')";
		if(chatClass == "my"){
			createHtml = chatHtml(chatClass, data.fromNick, sendTime, `<a onMouseOver="this.style.cursor='pointer'" style="color:#fff;" onclick="'+clickEvent+'">`+viewFileName+"</a>", data, "Y", clickEvent);
		}else{
			createHtml = chatHtml(chatClass, data.fromNick, sendTime, `<a onMouseOver="this.style.cursor='pointer'" onclick="'+clickEvent+'">`+viewFileName+"</a>", data, "Y", clickEvent);
		}
		if(targetId ==  data.fromID || targetId ==  data.toID) {
			$("#chat").append(createHtml);
		}
		seq = pseq;
	} else if(data.msgType == "AF") {
		let proomNo = changedMsgStr.split("|")[0];
		let pseq = changedMsgStr.split("|")[1];
		let viewFileName = changedMsgStr.split("|")[2];
		let clickEvent = "downloadFile("+proomNo+", "+pseq+", '"+viewFileName+"')";
		if(chatClass == "my"){
			createHtml = chatHtml(chatClass, data.fromNick, sendTime, `<a onMouseOver="this.style.cursor='pointer'" style="color:#fff;" onclick="downloadFile(`+proomNo+`, `+pseq+`, '`+viewFileName+`')">`+viewFileName+"</a>", data, "Y",clickEvent);
		}else{
			createHtml = chatHtml(chatClass, data.fromNick, sendTime, `<a onMouseOver="this.style.cursor='pointer'" onclick="downloadFile(`+proomNo+`, `+pseq+`, '`+viewFileName+`')">`+viewFileName+"</a>", data, "Y",clickEvent);
		}
		$("#notice").append(createHtml);
		$("#chat").append(createHtml);
		seq = pseq;
	}
	if(userLevel != "2001") {
		$("#notice").parents(".chat_scroll").scrollTop(document.getElementById("notice").scrollHeight);
	}
	$("#chat").parents(".chat_scroll").scrollTop(document.getElementById("chat").scrollHeight);
}

function nowOpen(url) {
    window.open(url);
}

function downloadFile(proomNo,pseq,viewFileName){
	// console.log('viewFileName',viewFileName);
	// window.open("fileDownload?roomNo="+proomNo+"&seq="+pseq+"&viewFileName="+viewFileName);
	let url = "fileDownload?roomNo="+proomNo+"&seq="+pseq+"&viewFileName="+viewFileName;
	document.getElementById('fileDown').src = url;

}

function submitMessage(msgType) {
	// if (userLevel == "2001") {
	// 	if(CamOperConfirm('chat'))
	// 		return;
	// }

	let textMsg;
	let msg;
	
	// all, user 분기	
	if (msgType == "A"){
		textMsg = $("#noticeMsg").val().trim();
	}else{
		textMsg = $("#chatMsg").val().trim();
	}
	
	if (textMsg != "" || msgType == "V") {
		textMsg = encXssMsg(textMsg);
		let now = new Date();
		let msgtime = now.getHours() + ":" + now.getMinutes();
		let msgdate = (now.getMonth() + 1) + "" + now.getDate();
		let message = encodeURI(textMsg);
		
		//공지
		if(msgType == "A"){
			 msg = {
		            date: msgdate,
		            time: msgtime,
		            fromID: userId,
		            fromNick: userNick,
		            fromLevel: userLevel,
					toID: "",
		            toNick: "",
		            toLevel: "",
		            message: message,
					msgType: msgType
	        };
		//유저 강사,학생구분
		} else if(msgType == "U"){
			let toID, toNick, toLevel;
			if(userLevel == 1001 || userLevel == 1002){
				toID = toStudentID;
				toNick = toStudentNick;
				toLevel = toStudentLevel;
			} else if (userLevel == 2001){
				toID = managerId;
			}
			msg = {
		            date: msgdate,
		            time: msgtime,
		            fromID: userId,
		            fromNick: userNick,
		            fromLevel: userLevel,
					toID: toID,
		            toNick: toNick,
		            toLevel: toLevel,
		            message: message,
					msgType: msgType
			};
		}else if(msgType == "V"){
			let toID, toNick, toLevel;
			message = encodeURI('강의실에 입장하였습니다.');
			msg = {
				date: msgdate,
				time: msgtime,
				fromID: userId,
				fromNick: userNick,
				fromLevel: userLevel,
				toID: managerId,
				toNick: toNick,
				toLevel: toLevel,
				message: message,
				msgType: 'U'
			};
		}
		
		if(msg) {
			socket.emit('notify-ChatMsg', msg);
			// console.log('요청 : notify-ChatMsg');
			chatChage(userId, msg);
		}
	}
	
	if(msgType == "A"){
		$("#noticeMsg").val('');	
	} else {
		$("#chatMsg").val('');
	}
}

function submitWarningChat(warnReason,warnCount){
	let now = new Date();
	let msgtime = now.getHours() + ":" + now.getMinutes();
	let msgdate = (now.getMonth() + 1) + "" + now.getDate();
	let message = warnReason+","+warnCount;
	let toID, toNick, toLevel;
	toID = toStudentID;
	toNick = toStudentNick;
	toLevel = toStudentLevel;
	let splitMsg = message.split(",");
	if(splitMsg[0] == "S"){
		message = "경고가 부여되었습니다.\n 사유: 수면, 누적횟수: "+splitMsg[1]+"회";
	}else if(splitMsg[0] == "A"){
		message = "경고가 부여되었습니다.\n 사유: 자리비움, 누적횟수: "+splitMsg[1]+"회";
	}else if(splitMsg[0] == "P"){
		message = "경고가 부여되었습니다.\n 사유: 스마트폰 사용, 누적횟수: "+splitMsg[1]+"회";
	}else if(splitMsg[0] == "E"){
		message = "경고가 부여되었습니다.\n 사유: 기타, 누적횟수: "+splitMsg[1]+"회";
	}
	// 경고 주는 주체 분기
	// 강사가 격자모드에서 주는 경고
	if(userLevel != "2001"){
		msg = {
	            date: msgdate,
	            time: msgtime,
	            fromID: userId,
	            fromNick: userNick,
	            fromLevel: userLevel,
				toID: toID,
	            toNick: toNick,
	            toLevel: toLevel,
	            message: message,
				msgType: "U"
		};
	// 학생이 무단이탈해서 받는 경고
	}else{
		msg = {
	            date: msgdate,
	            time: msgtime,
	            fromID: managerId,
	            fromNick: "방송자1",
	            fromLevel: "1001",
				toID: toID,
	            toNick: toNick,
	            toLevel: toLevel,
	            message: message,
				msgType: "U"
		};
	}
	socket.emit('notify-ChatMsg', msg);
	// console.log('요청 : notify-ChatMsg');
	chatChage(userId, msg);
}

function firstNotiHtml(nick,sendTime,changedMsgStr){	
	let html = '<div class="chat_box">' +	
        '<div class="chat_user">' +
        '<div class="user_thumb normal"><span><img src="/live/img/test_img1.png"></span></div>' +
		'<div class="user_name">'+ nick +'공지: </div>' +
		'<div class="urer_time">'+ sendTime +'</div>' + 
        '</div>' +
        '<div class="chat_line"> 공지:'+ changedMsgStr +'</div>' +
        '</div></div>';	
		return html;
}