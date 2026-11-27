package com.devportal.model;

public final class Enums {
    private Enums() {}
    public enum Role { ADMIN, DEVELOPER, VIEWER }
    public enum ServiceStatus { ACTIVE, INACTIVE }
    public enum ServiceSource { MANUAL, GITHUB }
    public enum DocType { README, API, GUIDE }
    public enum SyncType { MANUAL, SCHEDULED }
    public enum SyncStatus { RUNNING, SUCCESS, PARTIAL, FAILED }
}
