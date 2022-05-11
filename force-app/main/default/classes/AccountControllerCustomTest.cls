@isTest
public with sharing class AccountControllerCustomTest {
    
    @TestSetup
    static void makeData(){
        List<Account> accounts = new List<Account>();
        for(Integer i = 0; i < 5; i++) {
            accounts.add(new Account(Name = 'Account ' + i, Rating = 'Hot'));
        }
        insert accounts;
    }

    @isTest 
    static void getAccounts_getAllAccounts_allAccountsGot() {
        List<Account> accounts = [SELECT Id FROM Account];
        Integer expectedSize = accounts.size();
        Test.startTest();
        Integer methodSize = AccountControllerCustom.getAccounts().size();
        Test.stopTest();
        System.assertEquals(expectedSize, methodSize, 'getAccounts method doesnt return all records');
    }

    @isTest 
    static void getAccounts_getAccountsSortedByName_AccountNotSorted() {
        Boolean sorting = true;
        Test.startTest();
        List<Account> accounts = AccountControllerCustom.getAccounts();
        Test.stopTest();
        for (Integer i = 0; i < accounts.size() - 1; i++) {
            if(accounts[i].Name > accounts[i+1].Name) {
                sorting = false;
            }
        }
        System.assertNotEquals(false, sorting, 'Records are not sorted by Name');
    }

    @isTest
    static void deleteAccount_deleteAccount_accountDeleted() {
        Account account = [SELECT Id, Name FROM Account WHERE Name = 'Account 1' LIMIT 1];
        Test.startTest();
        AccountControllerCustom.deleteAccount(account.Id);
        Test.stopTest();
        List<Account> withDeletedAccounts = [SELECT Id, Name FROM Account WHERE Name = 'Account 1' LIMIT 1];
        System.assertEquals(0, withDeletedAccounts.size(), 'Account was not deleted');
    }

    @isTest 
    static void deleteAccount_deleteNonExistentAccount_operationWithoutError () {
        Boolean errorMessage = false;
        String message;
        Test.startTest();
        try {
            AccountControllerCustom.deleteAccount('WrongId');
        }
        catch (Exception e) {
            message = e.getMessage();
        }
        Test.stopTest();
        System.assertNotEquals(true, errorMessage, 'There should not be error: ' + message);
    }

    @isTest 
    static void updateAccount_updateAccountName_AccountNameUpdated() {
        Account account = [SELECT Id, Name FROM Account LIMIT 1];
        account.Name = 'New Account';
        String expectedName = account.Name;
        List<Account> accounts = new List<Account>();
        accounts.add(account);
        Test.startTest();
        AccountControllerCustom.updateAccount(accounts);
        Test.stopTest();
        Account updatedAccount = [SELECT Id, Name FROM Account WHERE Id = :account.Id LIMIT 1];
        System.assertEquals(expectedName, updatedAccount.Name, 'Account name was not updated');
    }

    @isTest 
    static void updateAccount_updateAccountNameWithOversizeLength_updateAccountNotHappend() {
        Account account = [SELECT Id, Name FROM Account LIMIT 1];
        String expectedName = account.Name;
        String longAccountName;
        Boolean errorState = false;
        for (Integer i = 0; i < 256; i++) {
            longAccountName = longAccountName + '1';
        }
        account.Name = longAccountName;
        List<Account> accounts = new List<Account>();
        accounts.add(account);
        Test.startTest();
        try {
            AccountControllerCustom.updateAccount(accounts);
        }
        catch (Exception e) {
             errorState = true;
        }
        Test.stopTest();
        Account updatedAccount = [SELECT Id, Name FROM Account WHERE Id = :account.Id LIMIT 1];
        System.assertEquals(expectedName, updatedAccount.Name, 'Account name should not be updated');
        System.assertNotEquals(false, errorState, 'There should be error message ');
    }
}
