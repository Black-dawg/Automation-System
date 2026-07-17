package com.extension.autofill.model;

import lombok.Data;
import java.util.List;

@Data
public class FillRequest {
    private String cachedProfile;
    private List<FormField> formFields;
    private String model;
}
