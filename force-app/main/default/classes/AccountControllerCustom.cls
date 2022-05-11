public with sharing class AccountControllerCustom {
    @AuraEnabled(cacheable = true)
    public static List<Account> getAccounts() {
        List<Account> accounts = [SELECT Id, Name, Rating FROM Account ORDER BY Name];
        return accounts;
    }

    @AuraEnabled
    public static void deleteAccount(String id){
        List<Account> accounts = [SELECT Id FROM Account WHERE Id = :id];
        delete accounts;
    }

    @AuraEnabled
    public static void updateAccount(List<Account> accounts){
        update accounts;
    }
}
