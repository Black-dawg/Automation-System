package com.extension.autofill.model;

import lombok.Data;

@Data
public class UpdateRequest {
    private String cachedProfile;
    private String presetInfo;
    private String model;
}
