package com.extension.autofill.model;

import lombok.Data;
import java.util.List;

@Data
public class FormField {
    private String fieldId;
    private String fieldLabel;
    private String fieldType;
    private List<String> options;
}
