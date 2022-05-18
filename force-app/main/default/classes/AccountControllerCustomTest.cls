@isTest
class AccountControllerCustomTest {
    
    @testSetup
    private static void makeData(){
        List<Account> accounts = new List<Account>();
        for(Integer i = 0; i < 5; i++) {
            accounts.add(new Account(Name = 'Account ' + i, Rating = 'Hot'));
        }
        insert accounts;
    }

    @isTest 
    private static void getAccounts_getAllAccounts_allAccountsGot() {
        List<Account> accounts = [SELECT Id FROM Account];
        Integer expectedAccountsNumber = accounts.size();

        Test.startTest();
        Integer methodAccountsNumber = AccountControllerCustom.getAccounts().size();
        Test.stopTest();

        System.assertEquals(expectedAccountsNumber, methodAccountsNumber, 'getAccounts method doesnt return all records');
    }

    @isTest 
    private static void getAccounts_getAccounts_ErrorThrown() {
        Boolean isException = false;

        Test.startTest();
        List<Account> allAccounts = [SELECT Id FROM Account];
        delete allAccounts;
        try {
            AccountControllerCustom.getAccounts();
        } catch (Exception e) {
            if (e.getMessage().contains('Accounts list is empty')) {
                isException = true;
            }
        }
        Test.stopTest();
        
        System.assert(isException, 'Method should thrown an exception');
    }

    @isTest 
    private static void getAccounts_getAccountsSortedByName_AccountNotSorted() {
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
    private static void deleteAccount_deleteAccount_accountDeleted() {
        Account account = [SELECT Id, Name FROM Account WHERE Name = 'Account 1' LIMIT 1];
        
        Test.startTest();
        AccountControllerCustom.deleteAccount(account.Id);
        Test.stopTest();

        List<Account> withDeletedAccounts = [SELECT Id, Name FROM Account WHERE Name = 'Account 1' LIMIT 1];
        System.assertEquals(0, withDeletedAccounts.size(), 'Account was not deleted');
    }

    @isTest 
    private static void deleteAccount_deleteNonExistentAccount_operationWithoutError () {
        Boolean errorMessage = false;
        String message;
        Account account = [SELECT Id, Name FROM Account WHERE Name = 'Account 1' LIMIT 1];
        
        Test.startTest();
        try {
            AccountControllerCustom.deleteAccount('WrongId');
        } catch (Exception e) {
            errorMessage = true;
            message = e.getMessage();
        }
        
        Test.stopTest();

        System.assertNotEquals(true, errorMessage, 'There should not be error: ' + message);
    }

    @isTest 
    private static void updateAccount_updateAccountName_AccountNameUpdated() {
        Account account = [SELECT Id, Name FROM Account LIMIT 1];
        account.Name = 'New Account';
        List<Account> accounts = new List<Account>();
        accounts.add(account);

        Test.startTest();
        AccountControllerCustom.updateAccount(accounts);
        Test.stopTest();

        Account updatedAccount = [SELECT Id, Name FROM Account WHERE Id = :account.Id LIMIT 1];
        System.assertEquals(account.Name, updatedAccount.Name, 'Account name was not updated');
    }

    @isTest 
    private static void updateAccount_updateAccountNameWithOversizeLength_updateAccountNotHappend() {
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
        } catch (Exception e) {
             errorState = true;
        }
        Test.stopTest();

        Account updatedAccount = [SELECT Id, Name FROM Account WHERE Id = :account.Id LIMIT 1];
        System.assertEquals(expectedName, updatedAccount.Name, 'Account name should not be updated');
        System.assertNotEquals(false, errorState, 'There should be error message ');
    }
}
