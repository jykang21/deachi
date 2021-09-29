opaqueId = "videoroom-" + Janus.randomString(12);
doSimulcast = (getQueryStringValue("simulcast") === "yes" || getQueryStringValue("simulcast") === "true");
doSimulcast2 = (getQueryStringValue("simulcast2") === "yes" || getQueryStringValue("simulcast2") === "true");


$(document).ready(function () {
	// HeartBeat();
	enterTimeCheck(false,userId);
	if(iframeMode == 'screen') {
		iframSet(iframeMode);
    	janusInit();
	}
	
	if(userLevel == "1002" || popupMode == "rec") {
		if (!SERVER_URL) {
			$.ajax({
		    	url: 'https://mdmedia.sobro.co.kr:4000/GetMediaInfo',
		        data: {roomNo: roomNo, userId: userId, managerYn: (userId == managerId)?"Y":"N"},
		        type: 'POST',
				dataType: 'json',
				async: false,
		        success: function (data) {
			 		console.log(data);
					SERVER_URL = "wss://"+data.DOMAIN+":"+data.PORT+"/janus";
			    	janusInit();
		        },
		        error: function (data) {
		             console.log(data)
		        }
			});	
		}
	}
	var roomInfo = {

	}
});

// 입장하기
function enterDeviceSet(audioOutputValue,audioInputValue,videoSourceValue,videoRevValue){
	enterTimeCheck(true,userId);
	const constraints = {
	    video: {optional: [{sourceId: videoSourceValue}]},
	    audio: {optional: [{sourceId: audioInputValue}]},
		speaker: {optional: [{sourceId: audioOutputValue}]}
	};
	let videoCam = document.getElementById('video_cam');
	navigator.mediaDevices.getUserMedia(constraints).then(janusInit());
	audioSelectValue =  audioInputValue;
	videoSelectValue =  videoSourceValue;
	if(videoRevValue){
		videoCam.style.transform = "scaleX(-1)";
	}else{
		videoCam.style.transform = "";
	}
	document.querySelectorAll('video').forEach(el => el.setSinkId(audioOutputValue));
	$("#optionScreen").hide();

	if(userLevel == "2001"){
		submitMessage("V");
		toggleAudioVal = 'OFF';
		videoDevice.toggleDeviceAudio(onlocal, toggleAudioVal);
		// $("#enterinfo_pop").show();

	}

	// 미디어서버에 접속알림
	/*let mediaSocket = io.connect(mediaControlUrl, {
		'reconnect': true,
		'reconnection delay': 500,
		'reopen delay': 500,
		'max reconnection attempts': 5
	});
	mediaSocket.emit("notify-login-mediaserver", {RoomCode: roomNo, UserId:userId});
	console.log('요청 : notify-login-mediaserver');*/

}

// 설정값 적용하기 ( 설정 화면에서 적용 눌렀을때 )
function settingDeviceSet(audioOutputValue,audioInputValue,videoSourceValue,videoRevValue){
	const constraints = {
	    video: {optional: [{sourceId: videoSourceValue}]},
	    audio: {optional: [{sourceId: audioInputValue}]},
		speaker: {optional: [{sourceId: audioOutputValue}]}
	};
	let videoCam = document.getElementById('video_cam');
	navigator.mediaDevices.getUserMedia(constraints).then(function() {
		videoDevice.settingDevice(onlocal, audioInputValue, videoSourceValue, function() {});
	});
	if(videoRevValue){
		videoCam.style.transform = "scaleX(-1)";
	}else{
		videoCam.style.transform = "";
	}
	document.querySelectorAll('video').forEach(el => el.setSinkId(audioOutputValue));
	$("#optionScreen").hide();
}

function janusInit() {
    Janus.init({
        debug: "", callback: function () {
		    janus = new Janus({
		        server: SERVER_URL,
		        success: function () {
		            attach();
		        },
		        error: function (cause) {
		            
		        },
		        destroyed: function () {
		            
		        }
		    });
        }
    });
}

function attach() {
    janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: "P|"+opaqueId,
        success: function (pluginHandle) {
            onlocal = pluginHandle;
			
			// 참여
			publisherJoin();
        },
        error: function (cause) {
            
        },
        consentDialog: function (on) {
            Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
            if (on) {
                // Darken screen
            } else {
                // Restore screen
            }
        },
        onmessage: function (msg, jsep) {
            Janus.debug(" ::: Got a message (publisher) :::", msg, jsep);
            let event = msg["videoroom"];
            if (event === "joined") {
                // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any                
                mypvtid = msg["private_id"];
				if(userLevel != "1002" && popupMode != "rec") {
					publisherCreateOffer(true);
				}else if(userLevel == "1002"){
					socket.emit("req-question-list", {MEETING_CODE: roomNo, UserLevel:userLevel});
					// console.log('요청 : req-question-list');
					let userInfo = {
						MEETING_CODE: roomNo
					}
					socket.emit("req-examination-status", userInfo);
				}
                if (msg["publishers"]) {
                    let list = msg["publishers"];
                    Janus.debug("Got a list of available publishers/feeds:", list);
					publisherList(list);
                }
				if(userLevel == "2001") {
					toggleAudioVal = 'OFF';
					videoDevice.toggleDeviceAudio(onlocal, toggleAudioVal);
				}
				joinNext = true;
				socket.emit('notify-RoomUserCount', {});
				console.log('요청 notify-RoomUserCount');
			} else if (event === "event") {
            	if(msg["audio_codec"]) {
            		room_audio_codec = msg["audio_codec"];
				}
				if(msg["video_codec"]) {
					room_video_codec = msg["video_codec"];
				}
                if (msg["publishers"]) {
                    let list = msg["publishers"];
                    Janus.debug("Got a list of available publishers/feeds:", list);
					publisherList(list);
                } else if (msg["leaving"]) {
                    // One of the publishers has gone away?
                    let leaving = msg["leaving"];
                    Janus.log("Publisher left: " + leaving);
					removeRemote(leaving);
				} else if (msg["unpublished"]) {
                    // One of the publishers has unpublished?
                    let unpublished = msg["unpublished"];
                    Janus.log("Publisher left: " + unpublished);
                    if (unpublished === 'ok') {
                        // That's us
                        onlocal.hangup();
                        return;
                    }
					removeRemote(unpublished);
				} else if (msg["error"]) {
					if (msg["error_code"] === 426 || msg["error_code"] === 432) {
	                	// This is a "no such room" error: give a more meaningful description
						// 생성
	                    let create = {
	                        "request": "create",
	                        "description": "",
	                        "bitrate": 128000,
	                        "videocodec": "vp8",
	                        "publishers": maxMemCnt,
	                        "room": roomNo
	                    };	                    
	                    onlocal.send({message: create});
						// 참여
						publisherJoin();
					}
				}
            } else if (event === "destroyed") {
                // The room has been destroyed
                Janus.warn("The room has been destroyed!");
            }

            if (jsep) {
                Janus.debug("Handling SDP as well...", jsep);
                
                onlocal.handleRemoteJsep({jsep: jsep});
                // Check if any of the media we wanted to publish has
                // been rejected (e.g., wrong or unsupported codec)
                let audio = msg["audio_codec"];
                if (myStream && myStream.getAudioTracks() && myStream.getAudioTracks().length > 0 && !audio) {
                    // Audio has been rejected                    
                }
                let video = msg["video_codec"];
                if (myStream && myStream.getVideoTracks() && myStream.getVideoTracks().length > 0 && !video) {
                    // Video has been rejected                    
                }
            }
        },
        webrtcState: function (on) {
            Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
            if (on) {
                if(userLevel == "2001") {
					toggleAudioVal = 'OFF';
					videoDevice.toggleDeviceAudio(onlocal, toggleAudioVal);
					$("#video_cam").show();
					selfCamWidth = $("#video_cam").width();
				} else {
					$("#video_"+iframeMode).show();
					setPageInfo();
				}
				try {
					socket.emit("req-question-list", {MEETING_CODE: roomNo, UserLevel:userLevel});
					// console.log('요청 : req-question-list');
					let userInfo = {
						MEETING_CODE: roomNo
					}
					socket.emit("req-examination-status", userInfo)
					console.log('요청 : req-examination-status');

				} catch(err) {
					return;
				}
            }
        },
        onlocalstream: function (stream) {
            myStream = stream;
			let videoLive = loadLocal();
    		Janus.attachMediaStream(videoLive, myStream);
            //const bitrate = 0;
            onlocal.send({message: {request: "configure", bitrate: bitrate}});			
        },
        onremotestream: function (stream) {			
        },
        oncleanup: function () {
            // PeerConnection with the plugin closed, clean the UI
            // The plugin handle is still valid so we can create a new one            
        },
        detached: function () {
            // Connection with the plugin closed, get rid of its features
            // The plugin handle is not valid anymore            
        }
    });
}

function publisherJoin() {
    let username = userNick;
    let register = {
        request: "join",
        room: roomNo,
        ptype: "publisher",
        display: `${username}[${userId}]`
        // display: username
    };
    onlocal.send({message: register});
}

function publisherCreateOffer(useAudio) {
	let reqHeight = 240;
	let reqWidth = 320;

	if(userLevel == 1001){
		reqHeight = 1080;
		reqWidth = 1920;
	}else{
		reqHeight = 240;
		reqWidth = 320;
	}

	let  media= {
        audioRecv: false
        , videoRecv: false
        , audioSend: useAudio
        , videoSend: true
		// , video: 'hires'
        , video:{
			deviceId: {
				exact: videoSelectValue
				// width:1920,
				// width: {
	            //     min: 1280,
	            //     // ideal: 4096,
	            //     max: 4096
	            // },
				// // height:1080,
	            // height: {
	            //     min: 720,
	            //     // ideal: 2160,
	            //     max: 2160
	            // }
			},
			height: {ideal: reqHeight},
			width: {ideal: reqWidth}
        }
		, audio: {
			deviceId: {
				exact: audioSelectValue
			}
		}
    }

	if(iframeMode == 'screen') {
		media= {
	        audioRecv: false
	        , videoRecv: false
	        , audioSend: false
	        , videoSend: true
	        , video:'screen'
			// 화면공유 화질 설정
			, screenshareWidth: 1280
			, screenshareHeight: 720
			//, screenshareFrameRate: 40A
            // 오디오 공유 설정 옵션 - 녹화 이슈로 삭제
            ,captureDesktopAudio : {
                autoGainControl: false,
                echoCancellation: false,
                googAutoGainControl: false,
                noiseSuppression: false
            }
	    }
	}

    onlocal.createOffer(
        {
            // Add data:true here if you want to publish datachannels as well
            media: media,	// Publishers are sendonly
            // If you want to test simulcasting (Chrome and Firefox only), then
            // pass a ?simulcast=true when opening this demo page: it will turn
            // the following 'simulcast' property to pass to janus.js to true
            simulcast: doSimulcast,
            simulcast2: doSimulcast2,
            success: function (jsep) {
                Janus.debug("Got publisher SDP!", jsep);
                let publish = {request: "configure", audio: useAudio, video: true};
                // You can force a specific codec to use when publishing by using the
                // audiocodec and videocodec properties, for instance:
                // 		publish["audiocodec"] = "opus"
                // to force Opus as the audio codec to use, or:
                // 		publish["videocodec"] = "vp9"
                // to force VP9 as the videocodec to use. In both case, though, forcing
                // a codec will only work if: (1) the codec is actually in the SDP (and
                // so the browser supports it), and (2) the codec is in the list of
                // allowed codecs in a room. With respect to the point (2) above,
                // refer to the text in janus.plugin.videoroom.jcfg for more details
                onlocal.send({message: publish, jsep: jsep});
				if(iframeMode == 'screen') {
					window.parent.postMessage({
						'type': 'share'
					}, '*');
				}
            },
            error: function (error) {
                Janus.error("WebRTC error:", error);
                if(iframeMode == 'screen') {
					window.parent.postMessage({
					    'type': 'close'
					}, '*');
				} else {
                	if(coErrorCnt > 5)
                		return;
					coErrorCnt++;
					if (useAudio) {
						if(userLevel == "1001"){
							publisherCreateOffer(true);
						}else{
							publisherCreateOffer(false);
						}
	                } else {
						publisherCreateOffer(true);
	                }
				}
            }
        }
	);
}

function publisherList(list) {	
	if(list) {
		for (let f in list) {
			let id = list[f]["id"];
			let display = list[f]["display"];
			let audio = list[f]["audio_codec"];
			let video = list[f]["video_codec"];
			Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
			const idx = display.indexOf('[');
			let targetId = display.substring(idx + 1, display.length - 1);
			if(userLevel == "2001") {
				if(targetId == managerId+"_screen") {
					videoMove("teacher_main", "teacher_cam", "show");
					targetId = managerId;
				}
				if(targetId != managerId) {
					continue;
				}
			} else if(userLevel == "1001") {
				if(popupMode == "rec") {
					if(targetId == managerId){
						mode = "cam";
					} else if(targetId == managerId + "_screen"){
						mode = "screen";
					} else {
						continue;
					}
				} else{
					if(targetId == managerId || targetId == managerId+"_screen") {
						continue;
					}
				}
			}
			if(iframeMode != 'screen') {
				newRemoteFeed(id, display, audio, video);
			}
		}
	}
}

function subscriberJoin(onremote, id, video) {
	onremote.simulcastStarted = false;
	// We wait for the plugin to send us an offer	
	let subscribe = {
		request: "join",
		room: roomNo,
		ptype: "subscriber",
		feed: id,
		private_id: mypvtid
	};
	// In case you don't want to receive audio, video or data, even if the
	// publisher is sending them, set the 'offer_audio', 'offer_video' or
	// 'offer_data' properties to false (they're true by default), e.g.:
	// 		subscribe["offer_video"] = false;
	// For example, if the publisher is VP8 and this is Safari, let's avoid video
	if (Janus.webRTCAdapter.browserDetails.browser === "safari" &&
		(video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
		if (video)
			video = video.toUpperCase()
		toastr.warning("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
		subscribe["offer_video"] = false;
	}
	onremote.videoCodec = video;
	onremote.send({message: subscribe});
}

function subscriberCreateAnswer(onremote, jsep) {
	onremote.createAnswer({
		jsep: jsep,
		// Add data:true here if you want to subscribe to datachannels as well
		// (obviously only works if the publisher offered them in the first place)
		media: {audioSend: false, videoSend: (userLevel == "1002" || popupMode == "rec") ? true : false},	// We want recvonly audio/video
		success: function (jsep) {
			Janus.debug("Got SDP!", jsep);
			let body = {request: "start", room: roomNo};
			onremote.send({message: body, jsep: jsep});
		},
		error: function (error) {
			Janus.error("WebRTC error:", error);
			//bootbox.alert("WebRTC error... " + error.message);
		}
	});
}

function newRemoteFeed(id, display, audio, video) {	
	let onremote = null;
    janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: "S|"+opaqueId,
        success: function (pluginHandle) {
			onremote = pluginHandle;
			// 참여
			subscriberJoin(onremote, id, video);
        },
        error: function (error) {
			Janus.error("  -- Error attaching plugin...", error);
        },
        onmessage: function (msg, jsep) {
            Janus.debug(" ::: Got a message (subscriber) :::", msg, jsep);
            let event = msg["videoroom"];
            Janus.debug("Event: " + event);
			
            if (msg["error"]) {
                Janus.debug(msg["error"]);
            } else if (event) {
                if (event === "attached") {
					if(onremote) {
						let bfFeed = false;
						if(feeds.length > 0) {
							for(let idx = 1; idx < maxMemCnt; idx++) {
								if(feeds[idx]) {
									if(feeds[idx].rfid == id) {
		                                feeds[idx] = onremote;
		                                onremote.rfindex = idx;
										bfFeed = true;
										onremote.remoteIdx = getRemoteIdx(onremote.rfdisplay);
										break;
									}
								}
							}
						}
                        onremote.rfid = msg["id"];
                        onremote.rfdisplay = msg["display"];
						if(userLevel != "1001" || popupMode == "rec") {							
							onremote.remoteIdx = getRemoteIdx(onremote.rfdisplay);							
							const idx = display.indexOf('[');
							let targetId = display.substring(idx + 1, display.length - 1);
							let feedIdx;
							if(targetId == managerId) {
								feedIdx = maxMemCnt+1;
							} else if(targetId == managerId+"_rec") {
								feedIdx = maxMemCnt+2;
							} else if(targetId == managerId+"_screen") {
								iframeMode = 'screenMode';
								feedIdx = maxMemCnt+3;
							} else if(targetId == aqstudent_id) {
								feedIdx = maxMemCnt+4;
								aqstudent_idx = feedIdx;
							}
							if(feedIdx) {
	                            feeds[feedIdx] = onremote;
	                            onremote.rfindex = feedIdx;
								bfFeed = true;
							}							
						}
						if(!bfFeed) {
	                        /*for (let i = 1; i < maxMemCnt; i++) {
	                            if (!feeds[i]) {
	                                feeds[i] = onremote;
	                                onremote.rfindex = i;
									onremote.remoteIdx = getRemoteIdx(onremote.rfdisplay);
	                                break;
	                            }
	                        }*/
							const idx = getRemoteIdx(onremote.rfdisplay);
							if(idx <= maxMemCnt && !feeds[idx]) {
                                feeds[idx] = onremote;
                                onremote.rfindex = idx;
								onremote.remoteIdx = idx;
							}
						}
					}
                    Janus.log("Successfully attached to feed["+onremote.rfindex+"] " + onremote.rfid + " (" + onremote.rfdisplay + ") in room " + msg["room"]);
                } else if (event === "event") {
                    // Check if we got an event on a simulcast-related event from this publisher
                    let substream = msg["substream"];
                    let temporal = msg["temporal"];					
                    if ((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                        if (!onremote.simulcastStarted) {
                            onremote.simulcastStarted = true;
                            // Add some new buttons
                            addSimulcastButtons(onremote.rfindex, onremote.videoCodec === "vp8" || onremote.videoCodec === "h264");
                        }
                        // We just received notice that there's been a switch, update the buttons
                        updateSimulcastButtons(onremote.rfindex, substream, temporal);
                    }
                } else {
                    // What has just happened?
                }
			}
            if (jsep) {
                Janus.debug("Handling SDP as well...", jsep);
                // Answer and attach
				subscriberCreateAnswer(onremote, jsep);
            }
        },
        iceState: function (state) {
			Janus.log("ICE state of this WebRTC PeerConnection (feed #" + onremote.rfindex + ") changed to " + state);
        },
        webrtcState: function (on) {
			Janus.log("Janus says this WebRTC PeerConnection (feed #" + onremote.rfindex + ") is " + (on ? "up" : "down") + " now");

			if(userLevel == '2001') {
				const idx = onremote.rfdisplay.indexOf('[');
				const targetId = onremote.rfdisplay.substring(idx + 1, onremote.rfdisplay.length - 1);
				if(aqstudent_idx == onremote.rfindex) {
					if(userId != targetId) {
						// 로딩종료
						// console.log('=== 숨기기 ===');
						// $("#question_loading").hide();
					}
				}
			}

		},
        onlocalstream: function (stream) {
            // The subscriber stream is recvonly, we don't expect anything here
        },
        onremotestream: function (stream) {
            Janus.debug("Remote feed #" + onremote.rfindex + ", stream:", stream);
            if(userLevel != '2001') {				
				let startIdx = (currPageNo-1) * pageViewCnt + 1;
				let endIdx = startIdx + pageViewCnt - 1;
				if(fStream[onremote.rfindex]) {
					fStream[onremote.rfindex] = null;
				}
				fStream[onremote.rfindex] = stream;
				
				if(startIdx <= onremote.remoteIdx && endIdx >= onremote.rfindex && $("#remotevideo" + onremote.rfindex).length == 0) {
					loadRemote(onremote.rfindex);
				} else if(onremote.rfindex > maxMemCnt && $("#remotevideo" + onremote.rfindex).length == 0) {					
					loadTeacher(onremote.rfindex);
				}
			} else {
				const idx = onremote.rfdisplay.indexOf('[');
				const targetId = onremote.rfdisplay.substring(idx + 1, onremote.rfdisplay.length - 1);
            	if(aqstudent_idx == onremote.rfindex) {
            		if(userId != targetId) {
						createRemote($('#hiddenWarp'), targetId, onremote.rfindex);
						Janus.attachMediaStream($('#remotevideo' + onremote.rfindex).get(0), stream);
						feeds[aqstudent_idx].send({message: {request: "configure", audio: true, video: false}});
					}
				} else if ($("#remotevideo" + onremote.rfindex).length == 0) {
	                let videoWrap = loadRemoteWarp(onremote, targetId);					
					if(videoWrap) {
						createRemote(videoWrap, targetId, onremote.rfindex);		                
		                // Show the video, hide the spinner and show the resolution when we get a playing event
		                $("#remotevideo" + onremote.rfindex).bind("playing", function () {
		                    // // spinner 정지
		                    // if (onremote.spinner) {
		                    //     onremote.spinner.stop();
							// }
		                    // onremote.spinner = null;

		                    $('#waitingvideo' + onremote.rfindex).remove();
							$("#back_img").hide();
							
		                    if (this.videoWidth)
		                        $('#remotevideo' + onremote.rfindex).removeClass('hide').show();		                    
		                });
		                Janus.attachMediaStream($('#remotevideo' + onremote.rfindex).get(0), stream);
					}
	            }
			}
			// if(userLevel == "1002"){
			// 	firstStdClick();
			// }
        },
        oncleanup: function () {
            Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
			removeRemote(id);
			if(userLevel == "1001" || userLevel == "1002"){
				if(userLevel == "1001"){
					//dropOff(id);
				} else {
					
				}				
			}			
        }
	});
}

function leave() {	
	onlocal.detach();	
}