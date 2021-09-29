package kr.co.softbridge.daechilive.live.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResultWarnDto {
	String	resultCode;
	String	resultMessage;
	int		seq;
}
