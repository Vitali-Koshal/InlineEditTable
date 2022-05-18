public with sharing class AccountControllerCustom {

    @AuraEnabled(cacheable = true)
    public static List<Account> getAccounts() {
        List<Account> accounts = [SELECT Id, Name, Rating FROM Account ORDER BY Name];
        if (accounts.isEmpty()) {
            throw newMessageExeption('Accounts list is empty');
        }
        return accounts;
    }

    @AuraEnabled
    public static void deleteAccount(String id){
        List<Account> accounts = [SELECT Id FROM Account WHERE Id = :id];
        try {
            delete accounts;
        } catch (DmlException e) {
            throw newMessageExeption('Delete error: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateAccount(List<Account> accounts){
        try {
            update accounts;
        } catch (DmlException e) {
            throw newMessageExeption('Delete error: ' + e.getMessage());
        }
    }

    /*@AuraEnabled(cacheable = true)
    public static List<AggregateResult> getRatings(){ 
        List<AggregateResult> ratings = [SELECT Rating FROM Account GROUP BY Rating];
        return ratings;
    }*/

    private static AuraHandledException newMessageExeption(String message) {
        AuraHandledException auraException = new AuraHandledException(message);
        auraException.setMessage(message);
        return auraException;
    }
}
