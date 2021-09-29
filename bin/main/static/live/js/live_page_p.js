pageViewCnt = liViewCnt;
currPageNo = 1;

$(document).ready(function () {
	if(userId == managerId || userId == managerId+"_screen") {
		bitrate = 2048000;
	} else {
		bitrate = 512000;
	}
	
	if(userLevel != "2001") {
		createRemoteList();
		setPageInfo();
	}

	// 좌우반전
	$("#rev1").change(function() {
		if($("#rev1").is(":checked")) {
			//transform: scaleX(-1);
			videoSetting.style.transform = "scaleX(-1)";
		} else { // 좌우반전 체크박스 체크풀었을때
			videoSetting.style.transform = "";
		}
	});
	// 마이크
	$("#audio-output-test").click(function() {
		if($("#audio-output-test").hasClass("active")) {
			$("#audio-output-test").removeClass("active");
			$("#outVol").removeClass("active").attr("disabled", true);
			audioOutTest = false;
			audioElement.pause();
		} else {
			$("#audio-output-test").addClass("active");
			$("#outVol").addClass("active").attr("disabled", false);
			audioOutTest = true;
			audioOutVol()
			audioElement.play();
			audioOut();
		}
	});
	// 스피커
	$("#audio-input-test").click(function() {
		if($("#audio-input-test").hasClass("active")) {
			$("#audio-input-test").removeClass("active");
			audioInTest = false;
		} else {
			$("#audio-input-test").addClass("active");
			audioInTest = true;
			audioIn(myStream);
		}
	});
	// 이전
	$("#pagePrev").click(function() {
		currPageNo = currPageNo - 1;
		if(currPageNo == 0) {
			currPageNo = totalPage;
		}
		// 화면 처리 추가
		loadPageRemote(currPageNo);
		setPageInfo();
	});
	// 다음
	$("#pageNext").click(function() {
		currPageNo = currPageNo + 1;
		if(currPageNo > totalPage) {
			currPageNo = 1;
		}
		// 화면 처리 추가
		loadPageRemote(currPageNo);
		setPageInfo();
	});
	// 파일업로드
	$("#file").change(function(){
		let pureFileName = $("#file").val().split("\\")[2];	// 파일 명
		seq++;
		let uploadFileName = roomNo+"|"+seq+"|"+pureFileName;
		let now = new Date();
		let msgtime = now.getHours() + ":" + now.getMinutes();
		let msgdate = (now.getMonth() + 1) + "" + now.getDate();
		let toID, toNick, toLevel;
		if(userLevel == 1001 || userLevel == 1002){
			toID = toStudentID;
			toNick = toStudentNick;
			toLevel = toStudentLevel;
		} else if (userLevel == 2001){
			toID = managerId;
		}
		message = uploadFileName;
		if(msgType=="UF"){
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
		} else if(msgType=="AF"){
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
		}
		// 용량 체크
		let fileSize = document.getElementById("file").files[0].size;
		let maxFileSize = 200 * 1024 * 1024;
		// 확장자 체크
		// let lastIndex = document.getElementById("file").value.split(".").length;
		// let fileExtension = document.getElementById("file").value.split(".")[lastIndex-1].toLowerCase();
		let fileExtension;

		// let temp_filename; let temp_exp;
		if(document.getElementById("file").value.indexOf('.')>=0) {
			fileExtension = document.getElementById("file").value.substring(document.getElementById("file").value.lastIndexOf('.')+1,document.getElementById("file").value.length);
			fileExtension = fileExtension.toLowerCase();
		} else {
			fileExtension = '';
		}

		let possibleFileExtension = [
			"bmp", "rle", "dib", "jpeg", "jpg", "jpe", "jfif", "gif", "png" ,"tif" ,"tiff" ,"psd" ,"pcx",
			"ppt", "doc", "xls", "pptx", "docx", "pdf", "txt", "hwp",
			"wav", "wma", "mp3", "mp4", "mkv", "avi", "flv", "mov", "ts", "tp", 
			"7z", "zip", "alz", "egg", "rar", "ais", "arj", "zool"
		];
		if(maxFileSize < fileSize){
			alert("업로드 용량 제한");
		} else {
			if(possibleFileExtension.indexOf(fileExtension) > -1){
				socket.emit("notify-ChatMsg",msg);
				// console.log('요청 : notify-ChatMsg');
				chatChage(msg.toID, msg);
				document.getElementById("roomNo").value=roomNo;
				document.getElementById("seq").value=seq;
				document.getElementById("uploadForm").submit();
			} else {
				alert("올바르지 않은 확장자");
			}
		}
		// 파일 초기화
		$("#file").val("");
	});
	// 팝업 질의 수락 클릭
	$("#newAccept").click(function(){
		qnaStdIdx = qnaStdElm.findIndex(function(item) {
			return item.qId == newAcceptData.ID
		});
		let qnaRemIdx = qnaStdElm.findIndex(function(item) {
			return item.Q_YN == "Y"
		});
		$("#closeBtn"+qnaStdElm[qnaRemIdx].qId).remove();
		$("#questionRemote"+qnaStdElm[qnaRemIdx].qIdx).remove();
		$("#acceptBtn"+newAcceptData.ID).remove();
		closeQuestion(true, qnaStdElm[qnaRemIdx].qId, qnaStdElm[qnaRemIdx].qIdx);
		// '답변종료' 버튼 생성
		$("."+newAcceptData.ID).parents('.surface').find('.surf_feed').append(`<a href="javascript:;" class="btn_basic radius type2 close" id="closeBtn${newAcceptData.ID}" onclick="closeQuestion(true, '${qnaStdElm[qnaStdIdx].qId}', '${qnaStdElm[qnaStdIdx].qIdx}')">답변 종료</a>`);
		closeBtnId = newAcceptData.ID;
		newAcceptData.Q_YN = 'Y';
		newAcceptData.ImgSrc = studentProfImg(newAcceptData.ID);
		socket.emit("req-question-study",newAcceptData);
		// console.log('요청 : req-question-study');
	});
});

function  galleryQuestinsDisplay() {
	//
}

function basicQuestinsDisplay() {
	//
}
async function chageQuestionScreen() {
	if (qnaStdElm.length > 0) {
		const tmpQnaStdElm = [...qnaStdElm];
	
		await cleanQuestionRemoteList().then((req) => {			
			qnaStdElm = [];
			qnaStdCnt = 0;
			tmpQnaStdElm.forEach(function (data, idx) {							
				const questionData = {
					'Q_YN': data.Q_YN,
					'ID': data.qId,
					'MEETING_CODE': roomNo
				};				
				closeQuestion(false, data.qId, data.qIdx);
				setQuestion(questionData, tmpQnaStdElm);
			})
			for(let i = 0; i < qnaStdElm.length; i++){
				if(i >= 5){
					watingStdFidx = qnaStdElm[i].fIdx;
					watingStd = qnaStdElm[i].qId;
					watingStdQidx = qnaStdElm[i].qIdx;
					$("#userremote"+watingStdFidx).find('.surf_feed').append(`<a href="javascript:;" class="btn_basic radius type1 btn_accept" id="acceptBtn${watingStd}" onclick="acceptQuestion('${watingStd}', '${watingStdQidx}')">질문 수락</a>`);
					$("#userremote"+watingStdFidx).find('.surf_feed').css("display","block");
				}
			}
			return true;
		});
	}
}

function cleanQuestionRemoteList() {
	return new Promise(function(resolve, reject) {
		const questionRemoteCnt = $("#questionVideoList .thumb").length;
		
	    for (let c = 1; c <= questionRemoteCnt; c++) {
	        let remote = $('#questionRemote' + c);
	        if (remote) {
	            remote.empty().remove();
	        }
	    }
		resolve($("#questionVideoList .thumb").length);
	});
}

function isEmpty(str){
	if(typeof str == "undefined" || str == null || str == "")
		return true;
	else
		return false ;
}


function setQuestionState(data) {
// 학생 - 새로고침 정책 후 반영
}


function setQuestion(data, arrOrigin) {
	// 질문 요청

	if(data.Q_YN == 'N'){
		// arrOrigin 배열의 원본 요청리스트로 반드시 처리해야 함 (feeds.length LOOP는 매우 위험)
		let screenQnaCnt = $("#questionVideoList").find(".thumb").size();
		qnaStdCnt=qnaStdCnt+1;
		if( (screenQnaCnt < liViewCnt) && (userLevel == "1001") ) {
			// 질문자 영역 추가
			createQuestion(qnaStdCnt);
		}
		if(userLevel == "1001" ){
			$("#question").show();
			$("#default").hide();
		}
		for(let f=1; f<feeds.length; f++) {
			if(feeds[f]) {
				let remoteIdx = feeds[f].remoteIdx;
				const idx = feeds[f].rfdisplay.indexOf('[');
				let targetId;
				if(userLevel != "2001"){
					targetId = feeds[f].rfdisplay.substring(idx + 1, feeds[f].rfdisplay.length - 1);
				} else {
					targetId = userId;
				}
				if(targetId == data.ID) {
					if(qnaStdElm.length < qnaStdRow) {
						if (($("#listBoard").is(':visible')) && (userLevel == "1002")) {
							//
						}else{
							let videoWrap = $('#questionRemote' + qnaStdCnt).find("div.surf_rsl");
							if($("#remotevideo" + remoteIdx).length == 0) {
								videoWrap.append('<video class="rounded centered ' + targetId + '"id="remotevideo' + remoteIdx + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback" oncontextmenu="return false;" />');
								let videoElm = document.querySelector('#remotevideo'+remoteIdx);
								createRemoteHeight(videoWrap, videoElm, targetId, remoteIdx);
								Janus.attachMediaStream(document.querySelector("#remotevideo"+remoteIdx), fStream[f]);
							} else {
								if (pageViewCnt <= 5) {
									videoWrap.append($("#remotevideo" + remoteIdx));
								}
							}
							// 이태우
							if( pageViewCnt >= 16 && qnaStdElm){
								// 격자모드 추가
								videoWrap = $('#userremote' + remoteIdx).find("div.surf_rsl");
								videoWrap.append('<video class="rounded centered ' + targetId + '"id="remotevideo' + remoteIdx + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback" oncontextmenu="return false;" />');
								let videoElm = document.querySelector('#remotevideo'+remoteIdx);
								createRemoteHeight(videoWrap, videoElm, targetId, remoteIdx);
								Janus.attachMediaStream(document.querySelector("#remotevideo"+remoteIdx), fStream[f]);
							}
							feeds[f].send({message: confVieoTrue});
							videoWrap.css("padding-bottom", "0%");
							// 질문학생 Nick표시
							const idx = feeds[f].rfdisplay.indexOf('[');
							const targetName = feeds[f].rfdisplay.substring(0, idx);
							if($("video").hasClass(data.ID)){
								$("#qnaUserNm"+qnaStdCnt).text(targetName);
								let warningCount = getWarningCnt(data.ID);
								let warningHtml = getWarningHtml(warningCount);
								$("#qnaUserNm"+qnaStdCnt).append(warningHtml);
							}
							// 강사화면에서 학생캠에 '질문수락'버튼 생성
							let divSurfFeed = $("."+data.ID).parents('.surface').find('.surf_feed');
							divSurfFeed.empty();
							if( chatCount(data.ID) > 0 ){
								let chatCntHtml = '<span class="message_ic">'+chatCount(data.ID)+'</span>';
								divSurfFeed.append(chatCntHtml);


							}
							divSurfFeed.append(`<a href="javascript:;" class="btn_basic radius type1 btn_accept" id="acceptBtn${data.ID}" onclick="acceptQuestion('${targetId}', '${qnaStdCnt}')">질문 수락</a>`);
							divSurfFeed.show();
						}
					}
					let isDuplicate = qnaStdElm.some(function(elm){
						return elm.qId === targetId;
					});
					if(!isDuplicate){
						qnaStdElm.push({qId: targetId, qIdx: qnaStdCnt, fIdx: f, Q_YN: data.Q_YN});
					}
				}
			}
		}
		// 질문 수락
	}else if(data.Q_YN == 'Y'){
		qnaStdIdx = qnaStdElm.findIndex(function(item) {return item.qId == data.ID});
		if(userLevel != '2001') {
			if(qnaStdIdx == -1) { // 질문수락 상태에서 화면전환시 qnaStdIdx -1 로 떨어짐
				if(isEmpty(arrOrigin)) {
					let screenQnaCnt = $("#questionVideoList").find(".thumb").size();
					qnaStdCnt=qnaStdCnt+1;
					if( (screenQnaCnt < liViewCnt) && (userLevel == "1001") ) {
						// 질문자 영역 추가
						createQuestion(qnaStdCnt);
					}
					if(userLevel == "1001" ){
						$("#question").show();
						$("#default").hide();
					}
					if (($("#listBoard").is(':visible')) && (userLevel == "1002")) {
						//
					}else{
						for(let f=1; f<feeds.length; f++) {
							if(feeds[f]) {
								let remoteIdx = feeds[f].remoteIdx;
								const idx = feeds[f].rfdisplay.indexOf('[');
								let targetId;
								if(userLevel != "2001"){
									targetId = feeds[f].rfdisplay.substring(idx + 1, feeds[f].rfdisplay.length - 1);
								} else {
									targetId = userId;
								}
								if(targetId == data.ID) {
									if(qnaStdElm.length < qnaStdRow) {
										let videoWrap = $('#questionRemote' + qnaStdCnt).find("div.surf_rsl");
										if($("#remotevideo" + remoteIdx).length == 0) {
											videoWrap.append('<video class="rounded centered ' + targetId + '"id="remotevideo' + remoteIdx + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback" oncontextmenu="return false;" />');
											let videoElm = document.querySelector('#remotevideo'+remoteIdx);
											createRemoteHeight(videoWrap, videoElm, targetId, remoteIdx);
											Janus.attachMediaStream(document.querySelector("#remotevideo"+remoteIdx), fStream[f]);
										} else {
											if (pageViewCnt <= 5) {
												videoWrap.append($("#remotevideo" + remoteIdx));
											}
										}
										// 이태우
										if( pageViewCnt >= 16 && qnaStdElm){
											// 격자모드 추가
											videoWrap = $('#userremote' + remoteIdx).find("div.surf_rsl");
											videoWrap.append('<video class="rounded centered ' + targetId + '"id="remotevideo' + remoteIdx + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback" oncontextmenu="return false;" />');
											let videoElm = document.querySelector('#remotevideo'+remoteIdx);
											createRemoteHeight(videoWrap, videoElm, targetId, remoteIdx);
											Janus.attachMediaStream(document.querySelector("#remotevideo"+remoteIdx), fStream[f]);
										}
										feeds[f].send({message: confVieoTrue});
										videoWrap.css("padding-bottom", "0%");
										// 질문학생 Nick표시
										const idx = feeds[f].rfdisplay.indexOf('[');
										const targetName = feeds[f].rfdisplay.substring(0, idx);
										if($("video").hasClass(data.ID)){
											$("#qnaUserNm"+qnaStdCnt).text(targetName);
											let warningCount = getWarningCnt(data.ID);
											let warningHtml = getWarningHtml(warningCount);
											$("#qnaUserNm"+qnaStdCnt).append(warningHtml);
										}
										// 강사화면에서 학생캠에 '질문수락'버튼 생성
										let divSurfFeed = $("."+data.ID).parents('.surface').find('.surf_feed');
										divSurfFeed.empty();
										if( chatCount(data.ID) > 0 ){
											let chatCntHtml = '<span class="message_ic">'+chatCount(data.ID)+'</span>';
											divSurfFeed.append(chatCntHtml);

										}
										divSurfFeed.append(`<a href="javascript:;" class="btn_basic radius type2 close" id="closeBtn${targetId}" onClick="closeQuestion(true, '${targetId}', '${qnaStdCnt}')">답변 종료</a>`);
										divSurfFeed.show();
									}
								}
								let isDuplicate = qnaStdElm.some(function(elm){
									return elm.qId === targetId;
								});
								if(!isDuplicate){
									qnaStdElm.push({qId: targetId, qIdx: qnaStdCnt, fIdx: f, Q_YN: data.Q_YN});
								}
							}
						}
					}
				}else{
					if (($("#listBoard").is(':visible')) && (userLevel == "1002")) {
						qnaStdElm.push({qId: data.ID, qIdx: qnaStdCnt, fIdx: qnaStdCnt, Q_YN: data.Q_YN});

					}else{
						for (let j=0; j<arrOrigin.length; j++) {
							if (data.ID == arrOrigin[j].qId) {
								let origin_fidx = arrOrigin[j].fIdx;
								let targetId = arrOrigin[j].qId;
								if(feeds[origin_fidx]) {
									let remoteIdx = feeds[origin_fidx].remoteIdx;
									qnaStdCnt++;
									if(arrOrigin.length < qnaStdRow) {
										let screenQnaCnt = $("#questionVideoList").find(".thumb").size();
										if( (screenQnaCnt < liViewCnt) && (userLevel == "1001") ) {
											// 질문자 영역 추가
											createQuestion(qnaStdCnt);
										}
										if(userLevel == "1001" ){
											$("#question").show();
											$("#default").hide();
										}
										let videoWrap = $('#questionRemote' + qnaStdCnt).find("div.surf_rsl");
										if($("#remotevideo" + remoteIdx).length == 0) {
											videoWrap.append('<video class="rounded centered ' + targetId + '"id="remotevideo' + remoteIdx + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback" oncontextmenu="return false;" />');
											let videoElm = document.querySelector('#remotevideo'+remoteIdx);
											createRemoteHeight(videoWrap, videoElm, targetId, remoteIdx);
											Janus.attachMediaStream(document.querySelector("#remotevideo"+remoteIdx), fStream[origin_fidx]);
										} else {
											if (pageViewCnt <= 5) {
												$("#remotevideo" + remoteIdx).appendTo(videoWrap);
											}
										}
										// 이태우
										if( pageViewCnt >= 16 && arrOrigin){
											// 격자모드 추가
											videoWrap = $('#userremote' + remoteIdx).find("div.surf_rsl");
											videoWrap.append('<video class="rounded centered ' + targetId + '"id="remotevideo' + remoteIdx + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback" oncontextmenu="return false;" />');
											let videoElm = document.querySelector('#remotevideo'+remoteIdx);
											createRemoteHeight(videoWrap, videoElm, targetId, remoteIdx);
											Janus.attachMediaStream(document.querySelector("#remotevideo"+remoteIdx), fStream[origin_fidx]);
										}
										feeds[origin_fidx].send({message: confVieoTrue});
										videoWrap.css("padding-bottom", "0%");
										// 질문학생 Nick표시
										const idx = feeds[origin_fidx].rfdisplay.indexOf('[');
										const targetName = feeds[origin_fidx].rfdisplay.substring(0, idx);
										if($("video").hasClass(data.ID)){
											$("#qnaUserNm"+qnaStdCnt).text(targetName);
										}
										// 강사화면에서 학생캠에 '질문수락'버튼 생성

										if (($("#listBoard").is(':visible')) && (userLevel == "1002")) {
											//
										}else {
											let divSurfFeed = $("." + data.ID).parents('.surface').find('.surf_feed');
											divSurfFeed.empty();
											if( chatCount(data.ID) > 0 ){
												let chatCntHtml = '<span class="message_ic">'+chatCount(data.ID)+'</span>';
												divSurfFeed.append(chatCntHtml);
											}
											divSurfFeed.append(`<a href="javascript:;" class="btn_basic radius type2 close" id="closeBtn${arrOrigin[j].qId}" onClick="closeQuestion(true, '${arrOrigin[j].qId}', '${arrOrigin[j].qIdx}')">답변 종료</a>`);
											divSurfFeed.show();
										}
									}
								}
								if (($("#listBoard").is(':visible')) && (userLevel == "1002")) {
									//
								}else {
									let divSurfFeed = $("." + data.ID).parents('.surface').find('.surf_feed');
									divSurfFeed.empty();
									if( chatCount(data.ID) > 0 ){
										let chatCntHtml = '<span class="message_ic">'+chatCount(data.ID)+'</span>';
										divSurfFeed.append(chatCntHtml);

									}
									divSurfFeed.append(`<a href="javascript:;" class="btn_basic radius type2 close" id="closeBtn${arrOrigin[j].qId}" onClick="closeQuestion(true, '${arrOrigin[j].qId}', '${arrOrigin[j].qIdx}')">답변 종료</a>`);
									divSurfFeed.show();
								}
								// let divSurfFeed = $("."+data.ID).parents('.surface').find('.surf_feed');
								// divSurfFeed.empty();
								// divSurfFeed.append(`<a href="javascript:;" class="btn_basic radius type2 close" id="closeBtn${arrOrigin[j].qId}" onClick="closeQuestion(true, '${arrOrigin[j].qId}', '${arrOrigin[j].qIdx}')">답변 종료</a>`);
								// divSurfFeed.show();
								qnaStdElm.push({qId: targetId, qIdx: qnaStdCnt, fIdx: origin_fidx, Q_YN: data.Q_YN});
								break;
							}
						}
					}
				}
			}else{
				if( ($("#latticeBoard").is(':visible')) && userLevel == "1002"){
					let divSurfFeed = $("."+data.ID).parents('.surface').find('.surf_feed');
					divSurfFeed.empty();
					if( chatCount(data.ID) > 0 ){
						let chatCntHtml = '<span class="message_ic">'+chatCount(data.ID)+'</span>';
						divSurfFeed.append(chatCntHtml);
					}
					divSurfFeed.append(`<a href="javascript:;" class="btn_basic radius type2 close" id="closeBtn${data.ID}" onClick="closeQuestion(true, '${data.ID}')">답변 종료</a>`);
					divSurfFeed.show();
				}
				qnaStdElm[qnaStdIdx].Q_YN = data.Q_YN;
			}
		}
		// 질문한 학생에게만
		if($("#questionBtn").hasClass(data.ID)){
			$("#questionBtn").contents()[1].textContent = "질문중입니다!";
			$("#questionBtn").removeClass("on");
			$("#questionBtn").addClass("active");
			$("#questionBtn").css('pointer-events','none');
			if(userLevel == "2001") {
				toggleAudioVal = 'ON';
				videoDevice.toggleDeviceAudio(onlocal, toggleAudioVal);
			}
		}

		// 모든 학생에게
		changeThumbstdnt(data.ImgSrc);
		$(".thumb_stdnt").css("display","block");
		$(".thumb_stdnt").children(".stdnt_nm").children("span").text(data.ID+"학생");

		if( userLevel == "2001" && userId != data.ID ){
			// 로딩시작
			// console.log('=== 보이기 ===');
			// $("#question_loading").show();

			onlocal.send({message: {
					"request" : "listparticipants",
					"room" : roomNo
				}, success:function (e) {
					if(e.participants && e.participants.length>0){
						const listparticipants = e.participants.filter(function (participant) {
							return participant.publisher;
						});
						for (var f in listparticipants) {
							const id = listparticipants[f]["id"];
							const display = listparticipants[f]["display"];
							const audio = room_audio_codec;
							const video = room_video_codec;
							const idx = display.indexOf('[');
							const targetId = display.substring(idx + 1, display.length - 1);

							if(targetId == data.ID) {
								aqstudent_id = data.ID;
								newRemoteFeed(id, display, audio, video);
								break;
							}
						}
					}
				}
			});
		}

		// 학생이 질문을 취소할때
	}else if(data.Q_YN == 'C'){
		questionCheck = 'N';
		if(userLevel != '2001') {
			$("#acceptBtn"+data.ID).remove();
			qnaStdIdx = qnaStdElm.findIndex(function(item) {return item.qId == data.ID});
			if( qnaStdCnt > 5 ){
				$("#cntInfo").text("+"+qnaStdCnt-5);
			} else if (qnaStdCnt <= 5){
				$("#cntInfo").text("");
			}
			// 배열에서 제거
			if(qnaStdElm.length != 0){
				if(qnaStdElm[qnaStdIdx].qId === undefined) {
					//
				}else{
					closeQuestion(false, qnaStdElm[qnaStdIdx].qId, qnaStdElm[qnaStdIdx].qIdx);
					qnaStdElm.splice(qnaStdIdx,1);
				}
			}
			//qnaStdCnt--
		}
	// 강사가 답변종료 할때
	}else if(data.Q_YN == 'F'){
		questionCheck = 'N';
		qnaStdIdx = qnaStdElm.findIndex(function(item) {return item.qId == data.ID});
		// 배열에서 제거
		if(qnaStdElm){
			qnaStdElm.splice(qnaStdIdx,1);
		}
		if($("#questionBtn").hasClass(data.ID)){
			$("#questionBtn").contents()[1].textContent = "쌤 질문있어요!";
			$("#questionBtn").removeClass("active");
			$("#questionBtn").css('pointer-events','auto');
			if(userLevel == "2001") {
				toggleAudioVal = 'OFF';
				videoDevice.toggleDeviceAudio(onlocal, toggleAudioVal);
			}
		}
		if(userLevel == "1002"){
			let divSurfFeed = $("."+data.ID).parents('.surface').find('.surf_feed');
			divSurfFeed.empty();
		}
		$(".thumb_stdnt").hide();

		//
		if(userLevel == "2001" && userId != data.ID){
			$("#remotevideo" + aqstudent_idx).empty().remove();
			if(feeds[aqstudent_idx]) {
				feeds[aqstudent_idx].detach();
				feeds[aqstudent_idx] = null;
			}
			aqstudent_id = "";
			aqstudent_idx = "";
		}
	}
	// 질문요청 5개넘어가면 나머지 카운트 세주기	
	$("#cntInfo").text(qnaStdElm.length > qnaStdRow ? qnaStdElm.length-qnaStdRow : "");
}

function createQuestion(qIdx) {
	
	if(userLevel == "1002" )
		return;
	let appendElm = $("#questionVideoList");
	createHtml = `
		<div class="thumb surface state" id="questionRemote${qIdx}">
			<div class="surf_in" style="width: 100%; height: 100%;">
				<div class="surf_rsl" style="width: 100%; height: 100%;"></div>
			</div>
			<div class="surf_state">
				<div class="surf_name" id="qnaUserNm${qIdx}"></div>
				<div class="surf_feed" style="display: block;"></div>
			</div>
		</div>`;
	appendElm.append(createHtml);
}

// '질문수락' 버튼
function acceptQuestion(qId, qIdx) {
	if(userLevel == "1002")
		return;
	newAcceptData = {MEETING_CODE: roomNo, ID: qId, Q_YN: "N"};
	// 이미 피드에 답변종료 버튼이 있을때
	if($(".surf_feed").children('a').hasClass('close')){
		// 팝업 보여주기
		$("#qnaaccept_pop").css('display','block');
	} else {
		$("."+qId).parents('.surface').find('.surf_feed').empty();
		//$("#acceptBtn"+qId).remove();
		// '답변종료' 버튼 생성
		$("."+qId).parents('.surface').find('.surf_feed').append(`<a href="javascript:;" class="btn_basic radius type2 close" id="closeBtn${qId}" onclick="closeQuestion(true, '${qId}', '${qIdx}')">답변 종료</a>`);
		closeBtnId = qId;
		let imgSrc = studentProfImg(qId);
		socket.emit("req-question-study", {MEETING_CODE: roomNo, ID: qId, Q_YN: "Y", ImgSrc:imgSrc});
		// console.log('요청 : req-question-study');
	}
}

// ID별 채팅카운터
function chatCount(userID){
	let eachCount = 0;
	let uIdx = uChatCnt.findIndex(function(item) {return item.userId == userID});
	if(uIdx > -1) {
		eachCount = uChatCnt[uIdx].chatCnt;
	}
	return eachCount;
}



function changeThumbstdnt(imgPath){
	if(imgPath == ""){
		$("#stdnt_img").attr("src", "/live/img/test_img1.png");
	}else{
		$("#stdnt_img").attr("src", imgPath);
	}
}

// 학생 프로필 이미지 경로
function studentProfImg(uID){
	let pfImg;
	var matched = studentList.find((el) => {
		return el.userId === uID
	});
	try {
		if (matched.userProfileImg === undefined){
			throw new Error("");
		}else{
			pfImg = matched.userProfileImg;
		}
	}catch(error){
		pfImg = "/live/img/test_img1.png"
		// console.log(error.message);
	}

	return pfImg;
}

// '답변종료' 버튼
function closeQuestion(chatSend, qId, qIdx) {
	if(userLevel == "1002")
		return; // 조교일때 모니터링 만
	$("#closeBtn"+qId).remove();
	$("#questionRemote"+qIdx).remove();
	$("."+qId).parents('.surface').find('.surf_feed').hide();
	
	let closeIdx = qnaStdElm.findIndex(function(item) {
		return item.qId == qId;
	});
	if($("#questionVideoList").children().length != qnaStdElm.length && qnaStdElm.length > 5 && closeIdx < 5){
		createQuestion(qnaStdElm[5].qIdx);
	}
	
	if($("#questionVideoList").find("video").size() == 0) {		
		$("#question").hide();
		$("#default").show();
		setPageInfo();
		if(pageViewCnt < 16){
			loadPageRemote(currPageNo);
		}		
	} else if($("#questionVideoList").find("video").size() < qnaStdRow && qnaStdElm.length > qnaStdRow) {
		
		//createQuestion(qnaStdElm[qnaStdRow].qIdx);
		let videoWrap = $('#questionRemote' + qnaStdElm[qnaStdRow].qIdx).find("div.surf_rsl");
		if($("#remotevideo" + qnaStdElm[qnaStdRow].fIdx).length == 0) {
			videoWrap.append('<video class="rounded centered ' + qnaStdElm[qnaStdRow].qId + '"id="remotevideo' + qnaStdElm[qnaStdRow].fIdx + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback" oncontextmenu="return false;" />');
			let videoElm = document.querySelector('#remotevideo'+qnaStdElm[qnaStdRow].fIdx);
			createRemoteHeight(videoWrap, videoElm, qnaStdElm[qnaStdRow].qId, qnaStdElm[qnaStdRow].fIdx);
			Janus.attachMediaStream(videoElm, fStream[qnaStdElm[qnaStdRow].fIdx]);
		} else {
			videoWrap.append($("#remotevideo" + qnaStdElm[qnaStdRow].fIdx));
		}
		feeds[qnaStdElm[qnaStdRow].fIdx].send({message: confVieoTrue});
		videoWrap.css("padding-bottom", "0%");
		// 질문학생 Nick표시
		const idx = feeds[qnaStdElm[qnaStdRow].fIdx].rfdisplay.indexOf('[');
		const targetName = feeds[qnaStdElm[qnaStdRow].fIdx].rfdisplay.substring(0, idx);
		$("#qnaUserNm"+qnaStdElm[qnaStdRow].qIdx).text(targetName);
		// 강사화면에서 학생캠에 '질문수락'버튼 생성
		$("."+qnaStdElm[qnaStdRow].qId).parents('.surface').find('.surf_feed').append(`<a href="javascript:;" class="btn_basic radius type1 btn_accept" id="acceptBtn${qnaStdElm[qnaStdRow].qId}" onclick="acceptQuestion('${qnaStdElm[qnaStdRow].qId}', '${qnaStdElm[qnaStdRow].qIdx}')">질문 수락</a>`);
		$("."+qnaStdElm[qnaStdRow].qId).parents('.surface').find('.surf_feed').show();
	}
	
	if(chatSend) {
		let cdata = {MEETING_CODE: roomNo, ID: qId, Q_YN: 'F'};
		socket.emit("req-question-study",cdata);
		// console.log('요청 : req-question-study');
	}
}

function videoRevMode() {
	if($("#rev1").is(":checked")) {// 좌우반전 체크박스 체크했을때
		//transform: scaleX(-1);
		videoEnter.style.transform = "scaleX(-1)";
	} else { // 좌우반전 체크박스 체크풀었을때
		videoEnter.style.transform = "";
	}
}

function videoMove(aftId, befId, showGb) {
	// console.log('videoMove');
	$("#"+befId).append($("#"+aftId+" video"));
	if(showGb == "show") {
		iframeMode = "screenMode";
		$("#teacherCam").show();
		// heightProc = $("#"+befId+" video").width()/16*9;
		heightProc = selfCamWidth/16*9;
		$("#"+befId+" video").height(heightProc);
	} else {
		$("#teacherCam").hide();
		$("#"+befId+" video").height("100%");
	}
}

function loadLocal() {
	let videoLive;
	if(iframeMode == 'screen') {
		videoLive = document.querySelector("#video_screen");
    	videoLive.style.objectFit = 'contain';
	} else {
		videoLive = document.querySelector("#video_cam");
    	videoLive.style.objectFit = 'cover';
	}
	
	videoLive.style.display = 'block';
	videoLive.style.width = '100%';
	if(userLevel == "2001") {
		// 학생 경고카운트 조회
		let cnt = getWarningCnt(userId);
		let warningHtml = getWarningHtml(cnt);
		$("#userName").children().remove();
		$("#userName").append(warningHtml);
		heightProc = $('#video_cam').width()/16*9;
    	videoLive.style.height = `${heightProc}px`;
	} else {
		videoLive.style.height = '100%';
		$("#back_img").hide();
	}
    
	return videoLive;
}

function localCamHeight() {
	let videoLive = document.querySelector("#video_cam");
	if(iframeMode == 'screenMode') {
		if(pageViewCnt > 5) {
			heightProc = $('#video_cam').width()*1.35;
		} else {
			heightProc = $('#video_cam').width()/16*9;
		}
		videoLive.style.height = `${heightProc}px`;
	} else {
		videoLive.style.height = '100%';
	}
}

function removeRemote(rfid) {	
	let removeRemote;
	for(let f=1; f<feeds.length; f++) {
		if(feeds[f]) {
			if(feeds[f].rfid == rfid) {
				removeRemote = feeds[f];
				break;
			}
		}
	}
	if(removeRemote) {        
        const idx = removeRemote.rfdisplay.indexOf('[');
        const targetId = removeRemote.rfdisplay.substring(idx + 1, removeRemote.rfdisplay.length - 1);
		qnaStdIdx = qnaStdElm.findIndex(function(item) {return item.qId == targetId});
		if(qnaStdIdx > -1){
			closeQuestion(false,targetId,qnaStdElm[qnaStdIdx].qIdx);
		}
		if(targetId === managerId+"_screen") {
			if(userLevel == "1002") {
				$("#teacher_cam").parents(".thumb_prof").addClass("active");				
				iframeMode = "cam";
				teacherCamHeight();
			} else {
				videoMove("teacher_cam", "teacher_main", "hide");
			}
        	$("#remotevideo" + removeRemote.rfindex).empty().remove();
		} else if(targetId === managerId) {
			$("#remotevideo" + removeRemote.rfindex).empty().remove();
			$("#back_img").show();

		} else {			
			let removeElm = $("#remotevideo" + removeRemote.rfindex).parent("div").parent("div").parent("div");
			if(removeElm.length > 0) {
				let removeIdx = removeElm.attr("id").replace("userremote","");
								
				//도중이탈 학생 아이디 취득
				let idx = removeRemote.rfdisplay.indexOf('[');
            	let dropId = removeRemote.rfdisplay.substring(idx + 1, removeRemote.rfdisplay.length - 1);									
				if( !isNull(lectureData.broadcastStatus) && lectureData.broadcastStatus == '24003') {
					//dropOff(dropId, getServerTime());
				}									 														
				// $("#userNm"+removeIdx).empty(); 학생 나갈때 이름 사라지는 현상 해결을 위해 주석
			}
			$("#remotevideo" + removeRemote.rfindex).empty().remove();
			removeElm.find("div.surf_rsl").css("padding-bottom", "");
			removeElm.find("div.surf_feed").hide();
		}
		feeds[removeRemote.rfindex] = null;
		fStream[removeRemote.rfindex] = null;
	}
}

function cleanRemoteList() {
	for(let c=1; c<pageViewCnt+1; c++) {
		let remote = $('#userremote'+c);
		if(remote) {
			remote.empty().remove();
		}
	}
}

function cleanRemote() {
	for(let f=1; f<maxMemCnt+1; f++) {
		if(feeds[f]) {
			feeds[f].send({message: confVieoFalse});
		}
	}
	for(let c=1; c<pageViewCnt+1; c++) {
		let video = $('#userremote'+c).find("div.surf_rsl video");
		if(video) {
			video.empty().remove();
		}
		let name = $("#userNm"+c);
		if(name) {
			name.empty();
		}
	}
}

function loadPageRemote(pageNo) {
	cleanRemote();
	createRemoteList();
	let startIdx = (pageNo-1) * pageViewCnt + 1;
	for(let i=0; i<pageViewCnt; i++) {
		let onremote;
		let videoIdx = i+1;
		let rfindex = startIdx + i;
		let videoElm = $('#userremote' + rfindex);
		let videoWrap = videoElm.find("div.surf_rsl");
		if(feeds[rfindex]) {
			onremote = feeds[rfindex];
            const idx = onremote.rfdisplay.indexOf('[');
            const targetId = onremote.rfdisplay.substring(idx + 1, onremote.rfdisplay.length - 1);
			const targetName = onremote.rfdisplay.substring(0, idx);
			videoIdx = onremote.remoteIdx;			
			videoElm = $('#userremote' + videoIdx);
			videoWrap = videoElm.find("div.surf_rsl");
			videoElm.find(".surf_feed").hide();
			videoWrap.css("padding-bottom", "");
			createRemote(videoWrap, targetId, onremote.remoteIdx);

			if(pageViewCnt > 5) {
				videoElm.attr("onclick", "selUserInfo('"+onremote.remoteIdx+"','"+targetId+"')");
			} else {
				videoElm.removeAttr("onclick");
			}
			Janus.attachMediaStream(document.querySelector("#remotevideo"+onremote.remoteIdx), fStream[rfindex]);
			onremote.send({message: confVieoTrue});
			setUserInfo(onremote.remoteIdx, targetName);
			
			// 학생 경고카운트 조회
			let warningCount = getWarningCnt(targetId);
			let warningHtml = getWarningHtml(warningCount);
			let orgUserInfo = $("#userNm"+videoIdx).html();			
			$("#userNm"+videoIdx).html(orgUserInfo + warningHtml);
			
			let uIdx = uChatCnt.findIndex(function(item) {return item.userId == targetId});
			if(uIdx > -1) {
				let count = uChatCnt[uIdx].chatCnt;
				if(videoElm.find(".message_ic").length < 1){
					let msgCntHtml = '<span class="message_ic">'+count+'</span>';
					videoElm.find('.surf_feed').append(msgCntHtml);
				}
				videoElm.find(".message_ic").text(count);
				if(count > 0)
					videoElm.find(".message_ic").show();
				if(count > 0) videoElm.find('.surf_feed').show();
			}
		}else{
			let uIdx = uChatCnt.findIndex(function(item) {return item.userId == getIdxRemoteID(rfindex)});
			if(uIdx > -1) {
				let count = uChatCnt[uIdx].chatCnt;
				if (videoElm.find(".message_ic").length < 1) {
					let msgCntHtml = '<span class="message_ic">' + count + '</span>';
					videoElm.find('.surf_feed').append(msgCntHtml);
				}
				videoElm.find(".message_ic").text(count);
				if (count > 0)
					videoElm.find(".message_ic").show();
				if (count > 0) videoElm.find('.surf_feed').show();
			}
		}
	}
}

function getResolution(){
	let teacherVidoe = $("#teacher_main").children('video');
	let re_height = 0;
	if($("#teacher_main").children('video').length > 0){
		re_height = teacherVidoe.get(0).videoHeight;
	}
	$("#getResolutionH").text(re_height+'p');
}

function resolutionDisplay(){
	setInterval(getResolution, 3000);
}




function loadRemoteWarp(onremote, targetId) {
	let videoWrap;
    if (targetId === managerId) {
		if($("#teacherCam").css("display") == "none"){
        	videoWrap = $("#teacher_main");
		} else {
        	videoWrap = $("#teacher_cam");
		}
    } else if (targetId === managerId+"_screen") {
		videoWrap = $("#teacher_main");
    } else if(userLevel == "1001" && popupMode != 'rec') {
		let idx = onremote.rfindex;
		if(idx > pageViewCnt) {
			idx -= (pageViewCnt * (currPageNo-1));
		}
        videoWrap = $('#userremote' + idx).find("div.surf_rsl");
    }
	return videoWrap;
}

function loadRemote(fIdx) {	
	let startIdx = (currPageNo - 1) * pageViewCnt + 1;
	let endIdx = startIdx + pageViewCnt;
	let videoIdx = fIdx - (currPageNo - 1) * pageViewCnt;
	let videoElm = $('#userremote' + videoIdx);
	let videoWrap = videoElm.find("div.surf_rsl");
	let onremote = feeds[fIdx];
	videoElm.find(".surf_feed").hide();
	videoWrap.css("padding-bottom", "");
	if(onremote) {
		if(startIdx <= onremote.remoteIdx && endIdx >= onremote.remoteIdx) {
            const idx = onremote.rfdisplay.indexOf('[');
            const targetId = onremote.rfdisplay.substring(idx + 1, onremote.rfdisplay.length - 1);
			const targetName = onremote.rfdisplay.substring(0, idx);
			
			videoIdx = onremote.remoteIdx;
			videoElm = $('#userremote' + videoIdx);
			videoWrap = videoElm.find("div.surf_rsl");
			createRemote(videoWrap, targetId, onremote.remoteIdx);				
			if(pageViewCnt > 5) {
				videoElm.attr("onclick", "selUserInfo('"+videoIdx+"','"+targetId+"')");
			} else {
				videoElm.removeAttr("onclick");
			}
			Janus.attachMediaStream(document.querySelector("#remotevideo"+onremote.remoteIdx), fStream[fIdx]);
			onremote.send({message: confVieoTrue});
			setUserInfo(onremote.remoteIdx, targetName);
						
			// 학생 경고카운트 조회
			let warningCount = getWarningCnt(targetId);
			let warningHtml = getWarningHtml(warningCount);
			let orgUserInfo = $("#userNm"+videoIdx).html();
			$("#userNm"+videoIdx).html(orgUserInfo + warningHtml);

			let uIdx = uChatCnt.findIndex(function(item) {return item.userId == targetId});
			if(uIdx > -1) {
				let count = uChatCnt[uIdx].chatCnt;
				if(count > 0)
					videoElm.find(".message_ic").show();
				videoElm.find(".message_ic").text(count);
				if(count > 0) videoElm.find('.surf_feed').show();
			}
			
			$('#userremote'+onremote.remoteIdx).removeClass('load');
		} else {
			onremote.send({message: confVieoFalse});
		}
	}
}

function getRemoteIdx(display) {
	const idx = display.indexOf('[');
	let targetId = display.substring(idx + 1, display.length - 1);
	let studentIdx = null;
	
	studentList.forEach(function (data, idx) {
		let studentId = data.userId;
		
		if(studentId == targetId) {
			studentIdx = data.remoteIdx;
		}
	});
	
	return studentIdx;
}

function getIDRemoteIdx(uID) {
	let targetId = uID
	let studentIdx = null;

	studentList.forEach(function (data, idx) {
		let studentId = data.userId;

		if(studentId == targetId) {
			studentIdx = data.remoteIdx;
		}
	});

	return studentIdx;
}

function getIdxRemoteID(uIdx) {
	let targetIdx = uIdx
	let studentID = null;

	studentList.forEach(function (data, idx) {
		let studentIdx = data.remoteIdx;

		if(studentIdx == targetIdx) {
			studentID = data.userId;
		}
	});

	return studentID;
}

function loadTeacher(fIdx) {
	if(userLevel == "1002" || popupMode == 'rec') {
		//debugger
		if(fIdx == maxMemCnt+1) {
			createRemote($("#teacher_cam"), managerId, fIdx);
			Janus.attachMediaStream(document.querySelector("#remotevideo"+fIdx), fStream[fIdx]);
			if (iframeMode != 'screenMode') {
				teacherCamHeight();
			}
		} else if(fIdx == maxMemCnt+3) {
			$("#teacher_cam").parents(".thumb_prof").removeClass("active");
			createRemote($("#teacher_screen"), managerId+"_screen", fIdx);
			Janus.attachMediaStream(document.querySelector("#remotevideo"+fIdx), fStream[fIdx]);
			teacherCamHeight();
		}
	}
	$("#back_img").hide();
}

function loadTeacherRec(fIdx) {
	if(fIdx == 0) {
		createRemote($("#teacher_cam"), managerId, fIdx);
		Janus.attachMediaStream(document.querySelector("#remotevideo"+fIdx), fStream[fIdx]);
		teacherCamHeight();
	} else if(fIdx == 1) {		
		$("#teacher_cam").parents(".thumb_prof").removeClass("active");
		//createRemote($("#teacher_screen"), managerId+"_screen", fIdx);
		Janus.attachMediaStream(document.querySelector("#remotevideo"+fIdx), fStream[fIdx]);
		teacherCamHeight();
	}

}

function teacherCamHeight() {
	let videoLive = document.querySelector("#teacher_cam");
	if(iframeMode == 'screenMode') {
		heightProc = 240/16*9;	// 격자모드일때 width값이 100으로 들어오는 문제로 240으로 고정
		videoLive.style.height = `${heightProc}px`;
	} else {
		videoLive.style.height = '100%';
	}
}

function createLattice() {
	cleanRemoteList();
	currPageNo = 1;
	pageViewCnt = laViewCnt;
	$("#lattMenu").hide();
	$("#listCont").hide();
	$("#listBoard").hide();
	$("#latticeCont").show();
	$("#latticeBoard").show();
	$("#listMenu").show();
	createRemoteList();
	setPageInfo();
	loadPageRemote(currPageNo);
	
	// 선택한 학생이 있을때
	if($("#remotevideo"+selIdx).length){
		$("#userremote"+selIdx).trigger("click");
	// 선택한 학생이 나갔을때 다음 학생이 존재할때
	}else if(currStudentCnt > 0){
		for(let i =0; i<feeds.length; i++){
			if(feeds[i] != null){
				$("#userremote"+feeds[i].remoteIdx).trigger("click");
			}
		}
	// 학생 아무도 없을때
	}else{
		// 차후 처리할 수도 있음.
	}
	chageQuestionScreen();
}

function createList() {
	cleanRemoteList();
	currPageNo = 1;
	pageViewCnt = liViewCnt;
	toStudentID = "";
	$("#listMenu").hide();
	$("#latticeCont").hide();
	$("#latticeBoard").hide();
	$("#listCont").show();
	$("#listBoard").show();
	$("#lattMenu").show();
	createRemoteList();
	setPageInfo();
	loadPageRemote(currPageNo);
	listUserInfo();
	chageQuestionScreen();
}

function createRemoteList() {
	let studentLen = studentList == null? 0 : studentList.length;
	let startIdx = (currPageNo-1) * pageViewCnt + 1;
	if(pageViewCnt > 5) {
		$("#videoLattice").empty();
	} else {
		$("#videoList").empty();
	}
	if (studentLen > 0) {
		for(let l=1; l < pageViewCnt+1; l++) {
			if( (l + startIdx - 1) > studentLen){
				break;
			}
			let appendElm;
			let userremote = $("#userremote"+l);
			if(pageViewCnt > 5) {
				appendElm = $("#videoLattice");
			} else {
				appendElm = $("#videoList");
			}
			let divId = "userremote${l}";
			let nameFeldId = "userNm${l}";
			let tmpStudent;
			let userName = "";
			if(startIdx == 1) {
				tmpStudent = studentList[l-1];
			} else {
				tmpStudent = studentList[startIdx+(l-2)];
			}
			
			if (!isNull(tmpStudent)) {
				divId = "userremote"+tmpStudent.remoteIdx;
				nameFeldId = "userNm"+tmpStudent.remoteIdx;
				
				if(!isNull(tmpStudent.userNm)){
					userName = tmpStudent.userNm;
				}
			}
	
			// origin
// 			createHtml = `
// 				<div class="thumb surface state load" id="${divId}">
// 					<div class="surf_in" style="width: 100%; height: 100%;">
// 						<div class="surf_rsl" style="width: 100%; height: 100%;"></div>
// 					</div>
// 					<div class="surf_state">
// 						<div class="surf_name" id="${nameFeldId}">${userName}</div>
// 						<div class="surf_feed" style="display: none;">
// <!--							<span class="message_ic">0</span>-->
// 						</div>
// 					</div>
// 				</div>`;

			createHtml = `
				<div class="thumb surface state load" id="${divId}" onclick=selUserInfo('${tmpStudent.remoteIdx}','${tmpStudent.userId}')>
					<div class="surf_in" style="width: 100%; height: 100%;">
						<div class="surf_rsl" style="width: 100%; height: 100%;"></div>
					</div>
					<div class="surf_state">
						<div class="surf_name" id="${nameFeldId}">${userName}</div>
						<div class="surf_feed" style="display: none;"></div>						
					</div>
				</div>`;
			if(userremote.length > 0) {
				appendElm.append(userremote);
			} else {
				appendElm.append(createHtml);
			}

			if(pageViewCnt <= 5) {
				let tVideoElm = $('#userremote' + (l + startIdx - 1));
				tVideoElm.removeAttr("onclick");
			}

		}
	}
}
function reEnterCheck(targetId){
	if(!offTmp[targetId]){
		return;
	}
	offTmp[targetId].reEnter = 0;
}

function createRemote(videoWrap, targetId, rfindex) {
	if($("#remotevideo" + rfindex).length == 0) {
    	videoWrap.append('<video class="rounded centered ' + targetId + '"id="remotevideo' + rfindex + '" autoplay playsinline disablePictureInPicture controlsList="nodownload noremoteplayback"  poster="/live/img/background.png" oncontextmenu="return false;" />');
    	reEnterCheck(targetId);
		$('#userremote'+rfindex).removeClass('load');
	}
	let videoElm = document.querySelector('#remotevideo'+rfindex);
	if(videoElm) {
		createRemoteHeight(videoWrap, videoElm, targetId, rfindex);
	}
}

let watingStdFidx = 0;
let watingStdQidx = 0;
let watingStdId = "";

function createRemoteHeight(videoWrap, videoElm, targetId, rfindex) {
    if(videoElm){
	    videoElm.style.width = '100%';
		if(iframeMode == 'screen') {
			heightProc = $('#remotevideo'+rfindex).width()/16*9;
	        videoElm.style.height = `${heightProc}px`;
		} else {
			if(userLevel == '1001') {
				videoWrap.css("padding-bottom", "0%");
				if(pageViewCnt > 5) {
					videoElm.style.height = '100%';
				} else {
					heightProc = $('#remotevideo'+rfindex).width()/16*9;

					if(heightProc > 100) {
						videoElm.style.height = `${heightProc}px`;
					}else{
						videoElm.style.height = '169px';
					}
				}
			} else if(userLevel == '1002') {
				if(targetId == managerId || targetId == managerId+"_screen") {
					videoElm.style.height = '100%';
				} else {
					videoWrap.css("padding-bottom", "0%");
					if(pageViewCnt > 5) {
						videoElm.style.height = '100%';
					} else {
						heightProc = $('#remotevideo'+rfindex).width()/16*9;
						if(heightProc > 100) {
							videoElm.style.height = `${heightProc}px`;
						}else{
							videoElm.style.height = '169px';
						}
					}
				}
			} else {
				if($("#teacherCam").css("display") == "none"){
					videoElm.style.height = '100%';
				} else {
					heightProc = $('#remotevideo'+rfindex).width()/16*9;
			        videoElm.style.height = `${heightProc}px`;
				}
			}
		}
  
	    videoElm.style.objectFit = 'cover';
		if (targetId == managerId+"_screen") {
			videoElm.style.height = '100%';
	    	videoElm.style.objectFit = 'contain';
		}
	}
}

function setPageInfo() {
	let appendElm, moveElm;
	if(pageViewCnt > 5) {
		appendElm = $("#pageLattice");
		moveElm = $("#pageList");
	} else {
		appendElm = $("#pageList");
		moveElm = $("#pageLattice");
	}
	if(moveElm) {
		appendElm.append(moveElm.children());
	}
	const remoteIdxSet = new Set();
	feeds.forEach(function(elm){
		if(!isNull(elm) && !isNull(elm.remoteIdx)){
			remoteIdxSet.add(elm.remoteIdx);
		}
	});
	
	for(let i=0; i<pageViewCnt; i++) {
		let videoIdx = i+1;
		let videoElm = $('#userremote' + videoIdx);
		let videoWrap = videoElm.find("div.surf_rsl");
		let startIdx = (currPageNo-1) * pageViewCnt + 1;
		let rfindex = startIdx + i;
		if(!feeds[rfindex]) {
			if(remoteIdxSet.has(videoIdx)){
				videoElm.find(".surf_feed").hide();
				videoWrap.css("padding-bottom", "0%");
			}
		}
	}
	totalPage = Math.ceil(maxMemCnt / pageViewCnt);
	createHtml = `${currPageNo} / ${totalPage}`
	$("#pageInfo").empty().append(createHtml);
	if(totalPage < 2) {
		$('#pagePrev').hide();
		$('#pageNext').hide();
	} else {
		$('#pagePrev').show();
		$('#pageNext').show();
	}
}

function setUserInfo(idx, targetName) {
	/*if(idx > pageViewCnt) {
		idx -= (pageViewCnt * (currPageNo-1));
	}*/
	$("#userNm"+idx).empty().append(targetName);
}

function selUserInfo(videoIdx, targetId) {
	selUserWarn(targetId);
	toStudentID = targetId;
	$(".chat_scroll_in").empty();
	$("#notichat").contents().find(".chat_scroll_in").empty();
	seqHisChatCheck = 0;
	socket.emit("history-ChatMsg", { MEETING_CODE: roomNo, UserID: targetId });
	// console.log('요청 : history-ChatMsg', targetId);
	
	$("#userremote"+selIdx).removeClass("active");
	let uIdx = uChatCnt.findIndex(function(item) {return item.userId == targetId});
	if(uIdx > -1) {
		uChatCnt[uIdx] = {userId: targetId, chatCnt: 0};
		//$("#userremote"+videoIdx).remove(".message_ic");
		$("#userremote"+videoIdx).find(".message_ic").hide();
		//$("#userremote"+videoIdx).find('.surf_feed').hide();
	}
	$("#userremote"+videoIdx).addClass("active");
	$("#userNm").empty().append($("#userNm"+videoIdx).text());

	$("#userIm").attr("src",studentProfImg(targetId));
	selIdx = videoIdx;
}

function listUserInfo() {
	$("#userremote"+selIdx).removeClass("active");
}

function iframLoad() {
	createHtml = '<iframe id="'+ iframeMode +'" src="/live/teacher/screen" style="width:100%; height: 100%;"></iframe>';
	let iframeElm = document.getElementById("video_iframe");
	iframeElm.innerHTML = createHtml;
}

function iframSet(mode) {
	window.parent.parentValSet();
	SERVER_URL = $("#mediaUrl").val();
	CHAT_URL = $("#chatUrl").val();
	roomNo = parseInt($("#roomNo").val());
	userId = $("#userId").val()+"_"+mode;
	userNick = $("#userNick").val();
	userLevel = $("#userLevel").val();
	managerId = $("#managerId").val();
	$("#mediaUrl").remove();
	$("#chatUrl").remove();
	$("#roomNo").remove();
	$("#userId").remove();
	$("#userNick").remove();
	$("#userLevel").remove();
	$("#managerId").remove();
}

//입력
function inLevelChange( time ) {
	if(audioInTest) {
  		let volum = inMeter.volume*50;
		$(".inlv").attr("disabled", true);
		if(volum > 0 && volum < 2) {
			volum = 2;
		} else if(volum > 1 && volum < 3) {
			volum = 3;
		} else if(volum > 2 && volum < 4) {
			volum = 4;
		} else if(volum > 3 && volum < 5) {
			volum = 5;
		} else if(volum > 4 && volum < 6) {
			volum = 6;
		} else if(volum > 5 && volum < 7) {
			volum = 7;
		} else if(volum > 6 && volum < 8) {
			volum = 8;
		} else if(volum > 7 && volum < 9) {
			volum = 9;
		} else if(volum > 8 && volum < 10) {
			volum = 10;
		} else if(volum > 9) {
			volum = 11;
		}
		for(let v=1; v<volum; v++) {
			$("#inlv"+v).attr("disabled", false);
		}
		rafID = window.requestAnimationFrame( inLevelChange );
	} else {
		$(".inlv").attr("disabled", true);
	}
}

//출력
function outLevelChange( time ) {
	if(audioOutTest) {
		let volum = outMeter.volume*35;
		$(".outlv").attr("disabled", true);
		if(volum > 0 && volum < 2) {
			volum = 2;
		} else if(volum > 1 && volum < 3) {
			volum = 3;
		} else if(volum > 2 && volum < 4) {
			volum = 4;
		} else if(volum > 3 && volum < 5) {
			volum = 5;
		} else if(volum > 4 && volum < 6) {
			volum = 6;
		} else if(volum > 5 && volum < 7) {
			volum = 7;
		} else if(volum > 6 && volum < 8) {
			volum = 8;
		} else if(volum > 7 && volum < 9) {
			volum = 9;
		} else if(volum > 8 && volum < 10) {
			volum = 10;
		} else if(volum > 9) {
			volum = 11;
		}
		for(let v=1; v<volum; v++) {
			$("#outlv"+v).attr("disabled", false);
		}
		rafID = window.requestAnimationFrame( outLevelChange );
	} else {
		$(".outlv").attr("disabled", true);
	}
}

function iframeStudentSet() {
	window.parent.userNickSet();
	userNick = $("#userNick").val();
	title = $("#title").val();
	startTime = $("#startTime").val();
	endTime = $("#endTime").val();
	tokenUserType = $("#tokenUserType").val();
	roomNo = $("#roomNo").val();
	userId = $("#userId").val();
	managerId = $("#managerId").val();
	userLevel = $("#userLevel").val();

	
	$("#userNick").remove();
	$("#title").remove();
	$("#startTime").remove();
	$("#endTime").remove();
	$("#tokenUserType").remove();
	$("#roomNo").remove();
	$("#userId").remove();
	$("#managerId").remove();
	$("#userLevel").remove();
}

function questionSend(){
	questionCheck = 'N';
	data = {
		MEETING_CODE: roomNo,
		ID: userId,
		Q_YN: questionCheck
	}
	socket.emit("req-question-study",data);
	// console.log('요청 : req-question-study');
}
function questionCancel(){
	questionCheck = 'C';
	data = {
		MEETING_CODE: roomNo,
		ID: userId,
		Q_YN: questionCheck
	}
	socket.emit("req-question-study",data);
	// console.log('요청 : req-question-study');
}

// 이해했어요!
function addUnderstandCount(){
	understandCount = 1;
	misUnderstandCount = 0;
	understandTotalCount += understandCount;
	let adata = {
		MEETING_CODE: roomNo,
		GOOD: understandCount,
		BAD : misUnderstandCount
	};
	if(understandTotalCount==0){
		$("#yesBtn span").text("");
	}else{
		$("#yesBtn span").text(understandTotalCount);
	}
	socket.emit("req-understand-study",adata);
	// console.log('요청 : req-understand-study');
}
function removeUnderstandCount(){
	understandCount = -1;
	misUnderstandCount = 0;
	understandTotalCount += understandCount;
	if(understandTotalCount < 0)
		understandTotalCount = 0;
	let rdata = {
		MEETING_CODE: roomNo,
		GOOD: understandCount,
		BAD: misUnderstandCount
	};
	if(understandTotalCount==0){
		$("#yesBtn span").text("");
	}else{
		$("#yesBtn span").text(understandTotalCount);
	}
	socket.emit("req-understand-study",rdata);
	// console.log('요청 : req-understand-study');

}

// 이해안돼요!
function removeMisunderstandCount(){
	misUnderstandCount = -1;
	understandCount = 0;
	misUnderstandTotalCount += misUnderstandCount;
	if(misUnderstandTotalCount < 0)
		misUnderstandTotalCount = 0;

	let rdata = {
		MEETING_CODE: roomNo,
		GOOD: understandCount,
		BAD: misUnderstandCount
	};
	if(misUnderstandTotalCount==0){
		$("#noBtn span").text("");
	}else{
		$("#noBtn span").text(misUnderstandTotalCount);
	}
	socket.emit("req-understand-study",rdata);
	//onsole.log('요청 : req-understand-study');
}
function addMisunderstandCount(){
	misUnderstandCount = 1;
	understandCount = 0;
	misUnderstandTotalCount += misUnderstandCount;
	let adata = {
		MEETING_CODE: roomNo,
		GOOD: understandCount,
		BAD: misUnderstandCount
	};
	if(misUnderstandTotalCount==0){
		$("#noBtn span").text("");
	}else{
		$("#noBtn span").text(misUnderstandTotalCount);
	}
	socket.emit("req-understand-study",adata);
	// console.log('요청 : req-understand-study');
}

// 질문있어요 취소후 대기시간 5초
function QuestionCoolTime() {
	let coolTime = 5;
	QPossibleYN = false;
	QCoolTimer = setInterval(function(){
		coolTime--;
		$("#questionBtn span").text(coolTime);
		if(coolTime <= 0){
			clearInterval(QCoolTimer);
			$("#questionBtn span").text("");
			QPossibleYN = true;
		}
	}, 1000);
}

//타이머 스타트
function timerStart() {
	getTotalSec();
	if(totalSec != 0){
		emitStopwatch(roomNo, 'S', sectoTime(totalSec));
		setTimer(hour, min, sec);
		$("#stopwatch").hide();
	}
}
//0보다 작은수는 0추가
function addZero(num) {
	return (num < 10 ? '0'+num : ''+num);
}
//화면애서 totalsec get
function getTotalSec() {
	hour = $("#hourten").val() + $("#hourone").val();
	min = $("#minten").val() + $("#minone").val();
	sec = $("#secten").val() + $("#secone").val();
	totalSec = parseInt(hour)*3600 + parseInt(min)*60 + parseInt(sec);
}
//totalsec 시간변환
function sectoTime(totalSec) {
	hour = addZero(parseInt(totalSec/3600));
	min = addZero(parseInt((totalSec%3600)/60));
	sec = addZero(totalSec%60);
	return hour + min + sec;
}
function procSec(phour, pmin, psec) {
	return parseInt(phour)*3600 + parseInt(pmin)*60 + parseInt(psec);
}
function closeExamTimer() {
	if(examRemainTimer) {
		clearInterval(examRemainTimer);
	}
	//$('.player_timer').hide();
	$('.player_exam_timer').removeClass('on');
	$('#player_exam_timer').text("00:00:00");
}

function closeTimer(recPoint) {
	if(userLevel != '2001') {
		reset();
		if(recPoint == "btn") {
			emitStopwatch(roomNo,'E', '000000');
		}
		$("#five, #thirty, #init, #start").show();
		$('#end').hide();
	}
	if(startTimer) {
		clearInterval(startTimer);
	}
	//$('.player_timer').hide();
	$('.player_timer').removeClass('on');
	$('#playerTimer').text("00:00:00");
	$("#timerPopArea").css('display','none');
}
function closeExamTimer(recPoint) {
	if(userLevel != '2001') {
		reset();
		if(recPoint == "btn") {
			examStopwatch('E', '000000');
		}
	}
	if(startTimer) {
		clearInterval(startTimer);
	}
	//$('.player_timer').hide();
	$("#examTimerPopArea").css('display','none');
	$('.player_exam_timer').removeClass('on');
	$('#player_exam_timer').text("00:00:00");
}
function reset() {
	$("#hourten").val(0).attr("disabled", false);
	$("#hourone").val(0).attr("disabled", false);
	$("#minten").val(0).attr("disabled", false);
	$("#minone").val(0).attr("disabled", false);
	$("#secten").val(0).attr("disabled", false);
	$("#secone").val(0).attr("disabled", false);
}
// 타이머 화면적용
function popTimer(phour, pmin, psec) {
	let hourten = phour.charAt(0);
	let hourone = phour.charAt(1);
	let minten = pmin.charAt(0);
	let minone = pmin.charAt(1);
	let secten = psec.charAt(0);
	let secone = psec.charAt(1);
	
	$("#hourten").val(hourten);
	$("#hourone").val(hourone);
	$("#minten").val(minten);
	$("#minone").val(minone);
	$("#secten").val(secten);
	$("#secone").val(secone);
}

// 6자리시간 -> 초단위로 변경
function convertSecond6Digits(digits) {
	let cHour = digits.substring(0,2);
	let cMinute = digits.substring(2,4);
	let cSecond = digits.substring(4,6);
	return parseInt(cHour)*3600 + parseInt(cMinute)*60 + parseInt(cSecond);
}

// 현재시간을 초단위로 변경
function convertSecondCurtime() {
	let today = new Date();
	let hours = today.getHours(); // 시
	let minutes = today.getMinutes();  // 분
	let seconds = today.getSeconds();  // 초
	return parseInt(hours)*3600 + parseInt(minutes)*60 + parseInt(seconds);
}

function setTimer_exam(data) {
	let examSecondTime = convertSecond6Digits(data.examTime);					// 시험시간으로 초단위로 변경
	var tempString = "" +data.startDate;
	let examstartSecondTime = convertSecond6Digits(tempString.substring(8,14));      // 시험시작시간을 초단위로 변경
	let examEndSecondTme = examSecondTime + examstartSecondTime; 					// 시험 끝나는 시간을 초단위로 변경
	let nowSecondTme = convertSecondCurtime();
	let remainTime = examEndSecondTme - nowSecondTme;
	let tHour = addZero(parseInt(remainTime/3600));
	let tmin = addZero(parseInt((remainTime%3600)/60));
	let tsec = addZero(remainTime%60);

	$("#examTimerPopArea").css('display','block');
	$('.player_exam_timer').addClass('on');
	$('#player_exam_timer').text(tHour +':'+ tmin + ':' + tsec);

	examRemainTimer = setInterval(function(){
		// remainTime--;
		examSecondTime = convertSecond6Digits(data.examTime);					// 시험시간으로 초단위로 변경
		tempString = "" +data.startDate;
		examstartSecondTime = convertSecond6Digits(tempString.substring(8,14));      // 시험시작시간을 초단위로 변경
		examEndSecondTme = examSecondTime + examstartSecondTime; 					// 시험 끝나는 시간을 초단위로 변경
		nowSecondTme = convertSecondCurtime();
		remainTime = examEndSecondTme - nowSecondTme;
		tHour = addZero(parseInt(remainTime/3600));
		tmin = addZero(parseInt((remainTime%3600)/60));
		tsec = addZero(remainTime%60);

		tHour = addZero(parseInt(remainTime/3600));
		tmin = addZero(parseInt((remainTime%3600)/60));
		tsec = addZero(remainTime%60);
		$('#player_exam_timer').text(tHour +':'+ tmin + ':' + tsec);
		if(remainTime == 0){
			clearInterval(examRemainTimer);
			closeExamTimer();
			if( (userLevel == 1001) && (data.examNo == 1) ){
				examEndAlimTalk();
			}
			examEnd(); 			// 채팅서버에 시험종료를 알림
		}
	}, 500);
}

function setTimer(phour, pmin, psec) {
	let startSetTime = parseInt(phour)*3600 + parseInt(pmin)*60 + parseInt(psec);
	popTimer(phour, pmin, psec);
	$('.player_timer').addClass('on');
	$("#timerPopArea").css('display','block');
	$('#playerTimer').text(phour +':'+ pmin + ':' + psec);

	let curSecondTime = convertSecondCurtime();
	let endSecondTime = startSetTime + curSecondTime;
	let remain_Time = endSecondTime - curSecondTime;
	
	$("#hourten").attr("disabled", true);
	$("#hourone").attr("disabled", true);
	$("#minten").attr("disabled", true);
	$("#minone").attr("disabled", true);
	$("#secten").attr("disabled", true);
	$("#secone").attr("disabled", true);
	
	startTimer = setInterval(function(){
		// startSetTime--;
		curSecondTime = convertSecondCurtime();
		remain_Time = endSecondTime - curSecondTime;
		phour = addZero(parseInt(remain_Time/3600));
		pmin = addZero(parseInt((remain_Time%3600)/60));
		psec = addZero(remain_Time%60);
		StudentSetTime = phour +':'+ pmin + ':' + psec;
		popTimer(phour, pmin, psec);
		$('#playerTimer').text(StudentSetTime);
		if(remain_Time == 0){
			clearInterval(startTimer);
			closeTimer('btn');
		}
	}, 500);
	//$('.player_timer').show();
	if(userLevel != '2001') {
		$("#five, #thirty, #init, #start").hide();
		$('#end').show();
	}
}
//5분추가
function addFivemin() {
	getTotalSec();
	totalSec = totalSec+300;
	sectoTime(totalSec);
	popTimer(hour,min,sec);
}
//30분추가
function addThirtymin() {
	getTotalSec();
	totalSec = totalSec+1800;
	sectoTime(totalSec);
	popTimer(hour,min,sec);
}
//socket emit
function emitStopwatch(roomNo, flag, time){
	let startTime = "";
	let reqId = userId;
	if(flag != "R") {
		startTime = showNowTime();
	}
	data = {
		MEETING_CODE: roomNo,
		FLAG: flag,
		TIME: time,
		START_TIME: startTime,
		UserID: reqId
	}
	socket.emit("req-stopwatch",data);
	// console.log('요청 : req-stopwatch');
}
//파일업로드
function fileUpload(val){
	msgType = val;
	$("#file").click();
}
// 경고
function warnReason(){
	$("#warnReason").css("display","block");
	$("#warnReason").toggleClass("on");
}

function warnStd(reason,toStudentID){
	$("#warnReason").removeClass("on");
	$("#warnReason").css("display","none");
	// DB에 경고 INSERT(ajax)
	$.ajax({
		 url :'setStudyWarning',
		 type : 'get',
		 //dataType : 'JSON',
		 data : {
			onairIdx : roomNo,
			studentUserId : toStudentID,
			warningType : reason,
			warningUser : lectureData.adminIdx
			},
		success : function(data){
			let count = 0;
			data = JSON.parse(data);
			// 정상
			if(data.resultCode === '00'){
				wdata = {
					MEETING_CODE: roomNo,
					ID: toStudentID,
					REASON: reason,
					COUNT: data.warningsCnt
				}
				// 중도이탈은 횟수 x, 채팅 x
				if(reason == "D"){
					return;
				}

				let stdIdx = studentList.findIndex(function(item){
					return item.userId == toStudentID;
				});
				count = studentList[stdIdx].warningsCnt+1;
				studentList[stdIdx].warningsCnt = count;
				// 경고 n 회 표시
				if(data.warningsCnt > 0){
					$(".urer_warn").text("경고"+data.warningsCnt+"회");
				} else {
					$(".urer_warn").text("");
				}
				// 학생 이름옆에 경고 동그라미 표시 
				if(data.warningsCnt == 1){
					$("div.surf_rsl").children("video."+toStudentID).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
					$("div.surf_rsl").children("video."+toStudentID).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w1'></i>");
				}else if(data.warningsCnt == 2){
					$("div.surf_rsl").children("video."+toStudentID).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
					$("div.surf_rsl").children("video."+toStudentID).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w2'></i>");
				}else if(data.warningsCnt >= 3){
					$("div.surf_rsl").children("video."+toStudentID).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
					$("div.surf_rsl").children("video."+toStudentID).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w3'></i>");
				}
				submitWarningChat(wdata.REASON,wdata.COUNT);
				socket.emit("req-warn-study",wdata);
				console.log('요청 : req-warn-study');
			// 비정상
			} else if(data.resultCode === "40"){
				alert("errorCode : "+resultCode+"\n"+resultMessage);
			} else if(data.resultCode === "50"){
				alert("errorCode : "+resultCode+"\n"+resultMessage);
			} else if(data.resultCode === "20"){
				alert("errorCode : "+resultCode+"\n"+resultMessage);
			} else if(data.resultCode === "30"){
				alert("errorCode : "+resultCode+"\n"+resultMessage);
			} else if(data.resultCode === "99"){
				alert("errorCode : "+resultCode+"\n"+resultMessage);
			} else{
				console.log("errorCode : "+resultCode+"\n"+resultMessage);
				// alert("관리자에게 문의하세요.");
			}
		},error : function(error){
			console.log(error);
		}
	});
}

function selUserWarn(targetId){
	// 대상 학생의 현재 경고건수 가져오기
	// 우측 채팅창에 학생 각자의 경고 횟수
	//let eachCnt = getTargetWarnningCnt(targetId);
	
	// 클릭한 학생의 경고회수 보여주기 ( 경고 n회 )
	let stdIdx = studentList.findIndex(function(item){
		return item.userId == targetId;
	});
	if(studentList[stdIdx].warningsCnt > 0){
		$(".urer_warn").text("경고"+studentList[stdIdx].warningsCnt+"회");
	} else {
		$(".urer_warn").text("");
	}
	// 강사화면의 학생 비디오에 경고 횟수
	if(studentList[stdIdx].warningsCnt == 1){
		$("div.surf_rsl").children("video."+targetId).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
		$("div.surf_rsl").children("video."+targetId).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w1'></i>");
	}else if(studentList[stdIdx].warningsCnt == 2){
		$("div.surf_rsl").children("video."+targetId).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
		$("div.surf_rsl").children("video."+targetId).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w2'></i>");
	}else if(studentList[stdIdx].warningsCnt >= 3){
		$("div.surf_rsl").children("video."+targetId).parents(".surface").children(".surf_state").children(".surf_name").children("i").remove();
		$("div.surf_rsl").children("video."+targetId).parents(".surface").children(".surf_state").children(".surf_name").append("<i class='warn w3'></i>");
	}
}

// 학생 현재 경고건수 가져오기
function getTargetWarnningCnt(targetId) {
	let cnt = 0;
	studentList.forEach(function (data) {
		if(data.userId == targetId) {
			cnt = data.warningsCnt+1;
			data.warningsCnt = cnt;
			//break;
			//studentList.some();
		}
	});
	return cnt;
}

// 입장런처화면에서 경고메세지를 보내주는 테스트
function enterTimeCheck(isEnter,userId){
	if(userLevel == "2001"){
		// 입장 O
		if(isEnter){
			clearTimeout(exitCheckTimer);
		// 입장 X
		} else {
			exitCheckTimer = setTimeout(function() {
				// 경고 부여
				//warnStd("A",userId);	// 자리비움
			}, 1000*60*5); // 5분
		}
	}
}

// 1차테스트 후 알림톡 발송
function examEndAlimTalk(){
	$.ajax({
		url :'test1endingtalk',
		type : 'post',
		dataType : 'text',
		data : {
			lectureIdx : lectureData.lectureIdx
		},
		success: function (data) {
			//console.log('success',data);
		},
		error : function(request, status, errorThrown) {
			//
		}
	});
}


function HeartBeat() {
	let today = new Date();
	let hours = today.getHours(); // 시
	let minutes = today.getMinutes();  // 분
	let seconds = today.getSeconds();  // 초
	let milliseconds = today.getMilliseconds(); // 밀리
	let sendTime = hours + ':' + minutes + ':' + seconds + ':' + milliseconds;
	socket.emit("req-modootest", {sendTime: sendTime});
	//console.log('요청 : req-modootest - ',sendTime);
	setTimeout(HeartBeat, 3000);
};

function exitRoom(){
	$("#exitRoom").show();	
}

// 학생전체 음소거
function reqStudentMute(){
	socket.emit("req-mute-meeting", {ID:'ALL', MEETING_CODE: roomNo, MUTE: 'Y'});
}

//강사 조교 강의종료 
function exitClass(){
	if(userLevel == 1001 || userLevel == 1002){
		socket.emit("req-exit-meeting", {MEETING_CODE: roomNo});
		console.log('요청 : req-exit-meeting');
	}
}

function examStart(examData){
	let examination = {
		lecturerNo: examData.lecturerNo,
		lectureExamIdx: examData.result.lectureExamIdx,
		examNo: examData.result.examNo,
		examYn: examData.examYn,
		MEETING_CODE: roomNo,
		examTime: examData.examTime,
		startDate: examData.startDate
	}
	if(false /*시헌중인지 체크값 넣어야함*/){
		alert("이전 시험이 종료되지 않았습니다.");
		return;
	}
	socket.emit("req-examination", examination);
	console.log('요청 : req-examination');
}

function examEnd(){
	let examination = {
		lecturerNo: 7,
		lectureExamIdx: 1,
		examNo: 3,
		examYn: "N",
		MEETING_CODE: roomNo,
		examTime: "000000",
		startDate: "000000"
	}
	socket.emit("req-examination", examination);
	console.log('요청 : req-examination');
}

function dropOff(dropId, serverTime){
	if(!serverTime){
		return;
	}
	console.log('dropOff',dropId);
	//나간 학생 구조체
	offTmp[dropId] = {
		drop : dropId,
		startSetTime: 300000, // 5분 300000
		reEnter: 1 // 입장플래그 0 입장 1나감
	};
	
	offTmp[dropId]['ref'] = setInterval(function(){		
		offTmp[dropId].startSetTime = offTmp[dropId].startSetTime - 1000 															
				
		//5분 지난후 경고 메세지
		if(offTmp[dropId].startSetTime == 0){
			clearInterval(offTmp[dropId]['ref']);
			warnStd("D",offTmp[dropId].drop); //임시 기능 막음
			//경고 카운트 메세지
		}
		//5분 전 입장 interval 멈춤
		if (offTmp[dropId].reEnter == 0){			
			clearInterval(offTmp[dropId]['ref']);
		}		
				
	}, 1000);		
}

// 서버시간조회
function getServerTime() {
	let serverTimeMap = {};
	$.ajax({
		url :'getServerTime',
		type : 'post',
		dataType : 'text',
		data : {},
		async: false,
		success: function (data) {			
			// 2021 05 13 00 13
			serverTimeMap.yyyymmddhhmiss = data;
			serverTimeMap.yyyy = data.substr(0, 4);
			serverTimeMap.month = data.substr(4, 2);
			serverTimeMap.day = data.substr(6, 2);
			serverTimeMap.hour = data.substr(8, 2);
			serverTimeMap.minute = data.substr(10, 2);
			serverTimeMap.second = data.substr(12, 2);									
        },            
		error : function(request, status, errorThrown) {
			console.log(request, status, errorThrown);
		}
	});
	
	return serverTimeMap;
}

// 방송참여인원수 업데이터
function setOnairStudentCnt(entryCnt) {
	const ajaxInputData = {
		entryCnt: entryCnt
		, onairIdx: roomNo
	};
	$.ajax({
		url :'setOnairStudentCnt',
		type : 'post',
		dataType : 'text',
		data : ajaxInputData,
		async: false,
		success: function (data) {			
			/*console.log('EntryCnt Update Proc');*/
        },            
		error : function(request, status, errorThrown) {
			console.log(request, status, errorThrown);
		}
	});
}

// 경고 카운트 가져오기
function getWarningCnt(studentId){
	if(studentList.length > 0) {
		for(let i = 0; i < studentList.length; i++){
			if(studentList[i].userId == studentId){
				return studentList[i].warningsCnt;	
			}
		}
	}
}

// nickName옆에 경고카운트에 해당하는 동그라미
function getWarningHtml(count){
	let classNm = "";
	if(count == 1){
		classNm = "w1";
	} else if(count == 2){
		classNm = "w2";
	} else if(count >= 3){
		classNm = "w3";
	}
	return "<i class='warn " + classNm + "'></i>";
}

// ifram(대치동) 에서 받은 alert 메시지 띄우는 함수
// function systemAlert(message) { alert(message); }


// iframe에서 상위Window객체 수호출을 위한 Listener  
window.addEventListener('message', function(event){

	// ifram(대치동) 에서 받은 함수 메시지 처리
	// if (typeof(window[event.data.action]) == "function") { window[event.data.action].call(null, event.data.message); }


	if (event.data.type == 'close') {
		screenModeCancle();
	} else if (event.data.type == 'examStart') {
		// 학생테스트호출
		let examData = event.data.examData;
		if(examData.result.code == '00') {
			examData.examYn = 'Y';
			examData.examTime = rightFillZero(6, examData.examTime.leftFillZero(4));
			examData.startDate = getServerTime().yyyymmddhhmiss;

			examStart(examData);

			$('#examScreen').attr('src', '');
			$("#examScreen").hide();
		} else {
			alert(examData.result.msg);
		}
	} else if (event.data.type == 'examClose') {
		// 시험창 닫기처리
		$('#examScreen').attr('src', '');
		$("#examScreen").hide();
	} else if (event.data.type == 'settingClose') {
		window.close();
	} else if (event.data.type == 'serverUrl') {
		SERVER_URL = event.data.url;
		enterDeviceSet(localStorage.getItem("speaker"), localStorage.getItem("audio"), localStorage.getItem("video"), (localStorage.getItem("videoRev")==="true"));
	}
});

// 조교 입장시 격자모드로 변경 / 첫번째학생 Click
function firstStdClick(){
	if(isFirstJoin){
		return;
	}
	createLattice();
	isFirstJoin = true;
	if(feeds[1]){
		$("#userremote"+feeds[1].remoteIdx).trigger("click");
	}else{
		// 차후 처리할 수도 있음.
	}
}

var ClevisURL = {
	// URL Pattern
	_patterns : {
		url : '(?:\\b(?:(?:(?:(ftp|https?|mailto|telnet):\\/\\/)?(?:((?:[\\w$\\-'
			+ '_\\.\\+\\!\\*\\\'\\(\\),;\\?&=]|%[0-9a-f][0-9a-f])+(?:\\:(?:[\\w$'
			+ '\\-_\\.\\+\\!\\*\\\'\\(\\),;\\?&=]|%[0-9a-f][0-9a-f])+)?)\\@)?((?'
			+ ':[\\d]{1,3}\\.){3}[\\d]{1,3}|(?:[a-z0-9]+\\.|[a-z0-9][a-z0-9\\-]+'
			+ '[a-z0-9]\\.)+(?:biz|com|info|name|net|org|pro|aero|asia|cat|coop|'
			+ 'edu|gov|int|jobs|mil|mobi|museum|tel|travel|ero|gov|post|geo|cym|'
			+ 'arpa|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|'
			+ 'bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bw|by|bz|ca|cc|cd|cf|cg|ch'
			+ '|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|e'
			+ 'r|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|'
			+ 'gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it'
			+ '|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|l'
			+ 't|lu|lv|ly|ma|mc|me|md|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|'
			+ 'mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph'
			+ '|pk|pl|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|s'
			+ 'i|sk|sl|sm|sn|sr|st|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tr|'
			+ 'tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|za|zm'
			+ '|zw)|localhost)\\b(?:\\:([\\d]+))?)|(?:(file):\\/\\/\\/?)?([a-z]:'
			+ '))(?:\\/((?:(?:[\\w$\\-\\.\\+\\!\\*\\(\\),;:@=ㄱ-ㅎㅏ-ㅣ가-힣]|%['
			+ '0-9a-f][0-9a-f]|&(?:nbsp|lt|gt|amp|cent|pound|yen|euro|sect|copy|'
			+ 'reg);)*\\/)*)([^\\s\\/\\?:\\"\\\'<>\\|#]*)(?:[\\?:;]((?:\\b[\\w]+'
			+ '(?:=(?:[\\w\\$\\-\\.\\+\\!\\*\\(\\),;:=ㄱ-ㅎㅏ-ㅣ가-힣]|%[0-9a-f]'
			+ '[0-9a-f]|&(?:nbsp|lt|gt|amp|cent|pound|yen|euro|sect|copy|reg);)*'
			+ ')?\\&?)*))*(#[\\w\\-ㄱ-ㅎㅏ-ㅣ가-힣]+)?)?)',
		querystring: new RegExp('(\\b[\\w]+(?:=(?:[\\w\\$\\-\\.\\+\\!\\*\\(\\),;'
			+ ':=ㄱ-ㅎㅏ-ㅣ가-힣]|%[0-9a-f][0-9a-f]|&(?:nbsp|lt|gt|amp|cent|poun'
			+ 'd|yen|euro|sect|copy|reg);)*)?)\\&?', 'gi')
	},

	/**
	 * _process : 정규식 컴파일 후 검색
	 * @param	(string)		string			문자열
	 * @param	(string)		modifiers		정규식 수식어
	 * @return	(mixed)							정규식 결과 = [ array | null ]
	 */
	_process : function (string, modifiers)
	{
		if ( ! string) throw new Error(1, '입력값이 비어 있습니다.');

		var p = new RegExp(ClevisURL._patterns.url, modifiers);
		return string.match(p);
	},

	/**
	 * collect : 문장에서 여러 URL 주소 검색
	 * @param	(string)		text			URL 을 찾을 문장
	 * @return	(array)							배열로 리턴
	 */
	collect : function (text)
	{
		var r = ClevisURL._process(text, 'gmi');
		return (r) ? r : [];
	},

	/**
	 * parse : 하나의 URL 주소를 분석
	 * @param	(string)		url				URL 주소
	 * @return	(object)						객체로 리턴
	 */
	parse : function (url, type)
	{
		var r = ClevisURL._process(url, 'mi');

		if ( ! r) return {};

		// HTTP 인증정보
		if (r[2]) r[2] = r[2].split(':');

		// 쿼리스트링 분석
		if (r[9]) {
			r[9] = r[9].match(ClevisURL._patterns.querystring);
			for (var n = 0; n < r[9].length; n++) {
				r[9][n] = (r[9][n] ? r[9][n].replace(/\&$/, '').split('=') : []);
				if (r[9][n].length == 1)
					r[9][n][1] = '';
			}
		}

		// 프로토콜이 없을 경우 추가
		if ( ! r[1] && ! r[5]) {
			// 도메인이 없는 경우 로컬 파일 주소로 설정
			if ( ! r[3]) r[5] = 'file';

			// E-Mail 인지 체크
			else if (r[0].match(new RegExp('^('+ r[2][0] +'@'+ r[3] +')$')))
				r[1] = 'mailto';

			// 기타 기본 포트를 기준으로 프로토콜 설정.
			// 포트가 없을 경우 기본적으로 http 로 설정
			else {
				switch (r[4]) {
					case 21:	r[1] = 'ftp'; break;
					case 23:	r[1] = 'telnet'; break;
					case 443:	r[1] = 'https'; break;
					case 80:
					default:	r[1] = 'http'; break;
				}
			}

			r[0] = (r[1] ? r[1] +'://' : r[5] +':///')
				+ r[0];
		}

		return {
			'url'		: r[0],						// 전체 URL
			'protocol'	: (r[1] ? r[1] : r[5]),		// [ftp|http|https|mailto|telnet] | [file]
			'userid'	: (r[2] ? r[2][0] : ''),	// 아이디 : HTTP 인증 정보
			'userpass'	: (r[2] ? r[2][1] : ''),	// 비밀번호
			'domain'	: (r[3] ? r[3] : ''),		// 도메인주소
			'port'		: (r[4] ? r[4] : ''),		// 포트
			'drive'		: (r[6] ? r[6] : ''),		// 'file' 프로토콜인 경우
			'directory'	: (r[7] ? r[7] : ''),		// 하위 디렉토리
			'filename'	: (r[8] ? r[8] : ''),		// 파일명
			'querys'	: (r[9] ? r[9] : ''),		// 쿼리스트링
			'anchor'	: (r[10] ? r[10] : '')		// Anchor
		};
	}
};// END: ClevisURL;