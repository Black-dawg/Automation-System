package com.extension.autofill.model;

import lombok.Data;

@Data
public class ParseRequest {
    private String resumeBase64;
    private String presetInfo;
    private String resumeLink;
    private String model;
}
