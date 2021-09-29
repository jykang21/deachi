opaqueId = "videoroom-" + Janus.randomString(12);
doSimulcast = (getQueryStringValue("simulcast") === "yes" || getQueryStringValue("simulcast") === "true");
doSimulcast2 = (getQueryStringValue("simulcast2") === "yes" || getQueryStringValue("simulcast2") === "true");


$(document).ready(function () {
	//enterTimeCheck(false,userId); 2021-05-21 김민수 삭제 : live_videoroom_rec.js 에서 필요 없음.
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
});

function janusInit() {
    Janus.init({
        debug: "", callback: function () {
		    janus = new Janus({
		        server: SERVER_URL,
		        success: function () {
		            attach();
		        },
		        error: function (cause) {
		            //console.log('cause : ', cause)
		        },
		        destroyed: function () {
		            //console.log('destroyed');
		        }
		    });
        }
    });
}

function attach() {
    janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: opaqueId,
        success: function (pluginHandle) {
            onlocal = pluginHandle;
			
			// 참여
			publisherJoin();
        },
        error: function (cause) {
            //console.log('cause : ', cause)
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
			//console.log(" ::: Got a message (publisher) :::", msg, jsep);
            let event = msg["videoroom"];
            if (event === "joined") {
                // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                //myid = msg["id"];
                mypvtid = msg["private_id"];
				if(userLevel != "1002" && popupMode != "rec") {
					publisherCreateOffer();
				}
                if (msg["publishers"]) {
                    let list = msg["publishers"];
                    Janus.debug("Got a list of available publishers/feeds:", list);
					publisherList(list);
                }
				joinNext = true;
			} else if (event === "event") {
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
					if (msg["error_code"] === 426) {
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
	                    //console.log(create);
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
                console.log("Handling SDP as well...", jsep);
                onlocal.handleRemoteJsep({jsep: jsep});
                // Check if any of the media we wanted to publish has
                // been rejected (e.g., wrong or unsupported codec)
                let audio = msg["audio_codec"];
                if (myStream && myStream.getAudioTracks() && myStream.getAudioTracks().length > 0 && !audio) {
                    // Audio has been rejected
                    //console.log("Our audio stream has been rejected, viewers won't hear us");
                }
                let video = msg["video_codec"];
                if (myStream && myStream.getVideoTracks() && myStream.getVideoTracks().length > 0 && !video) {
                    // Video has been rejected
                    //console.log("Our video stream has been rejected, viewers won't see us");
                }
            }
        },
        webrtcState: function (on) {
            Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
            if (on) {
                if(userLevel == "2001") {
					videoDevice.toggleDeviceAudio(onlocal, toggleAudioVal);
					$("#video_cam").show();
				} else {
					$("#video_"+iframeMode).show();
					setPageInfo();
					socket.emit("req-question-list", {MEETING_CODE: roomNo});
					// console.log('요청 : req-question-list');
				}
            } else {
				//
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
			//console.log("onremotestream",stream);
        },
        oncleanup: function () {
            // PeerConnection with the plugin closed, clean the UI
            // The plugin handle is still valid so we can create a new one
            //console.log('oncleanup');
        },
        detached: function () {
            // Connection with the plugin closed, get rid of its features
            // The plugin handle is not valid anymore
            //console.log('detached');
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

	console.log(register);
    onlocal.send({message: register});
}

function publisherCreateOffer() {	
	let  media= {
        audioRecv: false
        , videoRecv: false
        , audioSend: true
        , videoSend: true
        , video:{
			deviceId: {
				exact: videoSelectValue,
				width: {
	                min: 1280,
	                // ideal: 4096,
	                max: 4096
	            },
	            height: {
	                min: 720,
	                // ideal: 2160,
	                max: 2160
	            }
			}
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
            // 오디오 공유 설정 옵션
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
                let publish = {request: "configure", audio: true, video: true};
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
            },
            error: function (error) {
                Janus.error("WebRTC error:", error);
				if(useAudio == null)
					return;
                if (useAudio) {
                    publisherCreateOffer(false);
                } else {
					//console.log("WebRTC error", error);
                    //bootbox.alert("WebRTC error... " + error.message);
                    /*$('#publish').removeAttr('disabled').click(function () {
                        publisherCreateOffer(true);
                    });*/
                }
            }
        }
	);
}

function publisherList(list) {
	//console.log('list >> ', list)
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
			} else if(userLevel == "1001" || userLevel == "1002") {
/*			} else if(userLevel == "1001") {*/				
				if(popupMode == "rec") {
					if(targetId == managerId){
						mode = "cam";
					} else if(targetId == managerId + "_screen"){
						mode = "screen";
					}/* else {
						continue;
					}*/
										
					newRemoteFeed(id, display, audio, video);					
				}/* else{
					if(targetId == managerId || targetId == managerId+"_screen") {
						continue;
					}
				}*/
			}
/*			if(iframeMode != 'screen') {
				newRemoteFeed(id, display, audio, video);
			}*/
		}
	}
}

function subscriberJoin(onremote, id, video) {
	onremote.simulcastStarted = false;
	// We wait for the plugin to send us an offer
	//console.log('subscriberJoin >> ', roomNo, id, mypvtid)
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
        opaqueId: opaqueId,
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
				//console.log('event >> ', event, onremote);
                if (event === "attached") {
					if(onremote) {
						let bfFeed = false;					
						const idx = display.indexOf('[');
						let targetId = display.substring(idx + 1, display.length - 1);
						let feedIdx = -1;
						if(targetId == managerId) {
							feedIdx = 0;			// 강사 cam
						} else if(targetId == managerId+"_screen") {
							feedIdx = 1;			// 강사 screen
						}
						if(feedIdx >= 0) {
                            feeds[feedIdx] = onremote;
                            onremote.rfindex = feedIdx;
							bfFeed = true;
						}
						//console.log('feedIdx >>> ', feedIdx);
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
				if(popupMode == "rec"){
				}
				subscriberCreateAnswer(onremote, jsep);
            }
        },
        iceState: function (state) {
			Janus.log("ICE state of this WebRTC PeerConnection (feed #" + onremote.rfindex + ") changed to " + state);
        },
        webrtcState: function (on) {
			//Janus.log("Janus says this WebRTC PeerConnection (feed #" + onremote.rfindex + ") is " + (on ? "up" : "down") + " now");
			let set_streamElm;			
			if (onremote.rfindex == 0) {
				set_streamElm = document.querySelector('#remotevideo0');
			} else if (onremote.rfindex == 1) {
			 	set_streamElm = document.querySelector('#remotevideo1');
			}

			if(!isNull(set_streamElm) && !isNull(set_streamElm.srcObject)){
				set_streamElm.srcObject = fStream[onremote.rfindex];
			}				
        },
        onlocalstream: function (stream) {
            // The subscriber stream is recvonly, we don't expect anything here
        },
        onremotestream: function (stream) {
            //Janus.debug("Remote feed #" + onremote.rfindex + ", stream:", stream);            
			if(userLevel == '1001' || userLevel == '1002') {
				//console.log("Remote feed #" + onremote.rfindex + ", stream:", onremote, stream);
/*				let startIdx = (currPageNo-1) * pageViewCnt + 1;
				let endIdx = startIdx + pageViewCnt - 1;*/
				if(fStream[onremote.rfindex]) {
					fStream[onremote.rfindex] = null;
				}
				fStream[onremote.rfindex] = stream;
				
				loadTeacherRec(onremote.rfindex);		
/*				if(startIdx <= onremote.rfindex && endIdx >= onremote.rfindex && $("#remotevideo" + onremote.rfindex).length == 0) {
					loadRemote(onremote.rfindex);					
				} else if(onremote.rfindex > maxMemCnt && $("#remotevideo" + onremote.rfindex).length == 0) {					
					loadTeacher(onremote.rfindex);
					
				}*/
			} 
        },
        oncleanup: function () {
            Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
			//removeRemote(id);
			if (onremote.rfindex == 0) {
				feeds[0] = null;
				fStream[0] = null;
			} else if (onremote.rfindex == 1) {
				feeds[1] = null;
				fStream[1] = null;				
			}
        }
	});
}

function leave() {
	onlocal.detach();
}