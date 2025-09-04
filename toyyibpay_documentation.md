SandBox Mode
SandBox Mode
To use sandbox mode, please register an account at https://dev.toyyibpay.com. Here you can create dummy bills and make test payments via Bank Simulators.

For API testing purpose, replace the URL 'toyyibpay.com' with 'dev.toyyibpay.com' together with your sandbox account credentials.

Basic Information
API Process Flow
You will interact a lot with Category and Bill.

Category is a group of bills. You can create a category based on bills type. e.g. House rental, Subscription fees.

A bill is an invoice for your customer. A bill must belong to a Category

To start using the API, you would have to create a Category. Then the payment flow will kicks in as per below:

Customer visits your site.
Customer chooses to make payment.
Your site creates a Bill via API call.
toyyibPay API returns Bill's code.
Your site redirects the customer to Bill's URL.
The customer makes payment via payment option of choice.
toyyibPay sends a server-side update (Payment Completion) to your site on Bill's status on payment failure or success.
Your site can check payment status via API call
Request Information
Method : POST
Header :
Content-Type: multipart/form-data or x-www-form-urlencoded
APIs (All Users)
Create Category
Category is a collection of bills. As an example, you may create a 'Rental' Category for bill related to rental. User Secret Key is required in order to create a Category. Please login to toyyibPay to get User Secret Key.

In the example below, we will show you how to create a Category. You need to pass the following parameters to generate category code.

catname - Category Name
catdescription - Category Description
userSecretKey - User Secret Key
Our API system will return Category Code in JSON format.

Sample code

<?php
  $some_data = array(
    'catname' => 'toyyibPay General 2', //CATEGORY NAME
    'catdescription' => 'toyyibPay General Category, For toyyibPay Transactions 2', //PROVIDE YOUR CATEGORY DESCRIPTION
    'userSecretKey' => 'w5x7srq7-rx5r-3t89-2ou2-k7361x2jewhn' //PROVIDE USER SECRET KEY HERE
  );  

  $curl = curl_init();

  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/createCategory');  //PROVIDE API LINK HERE
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

  $result = curl_exec($curl);

  $info = curl_getinfo($curl);  
  curl_close($curl);

  $obj = json_decode($result);
  echo $result;
											
Sample result

[{"CategoryCode":"j0tzqhka"}]
											
Create Bill
Bill serves as an invoice to your customer.

In the example below, we will show you how to create a Bill. You need to pass the following parameters to generate bill code.

userSecretKey - User Secret Key
categoryCode - Category Code. Get your Category Code from Create Category API
billName - Your bill name. Bill Name will be displayed as bill title
* Max 30 alphanumeric characters, space and '_' only
billDescription- Your bill description.
* Max 100 alphanumeric characters, space and '_' only
billPriceSetting - For fixed amount bill, set it to 1 and insert bill amount. For dynamic bill (user can insert the amount to pay), set it to 0.
billPayorInfo - If you want to create open bill without require payer information, set it to 0. If you need payer information, set it to 1
billAmount - Key in the bill amount. The amount is in cent. e.g. 100 = RM1. If you set billPriceSetting to 0 (dynamic bill), please put 0
billReturnUrl - Key in return Url if you need the bill to be redirected to your own page upon payment completion.
billCallbackUrl - Key in callback url if you need the bill to be redirected to your callback page upon sucessful of payment transaction.
billExternalReferenceNo - Provide your own system reference no if you think it is required. You may use this reference no to check the payment status for the bill.
billTo - If you intend to provide the bill to specific person, you may fill the person nam in this field. If not, please leave it blank.
billEmail - Provide your customer email here
billPhone - Provide your customer phone number here.
billSplitPayment - [OPTIONAL] Set 1 if the you need the payment to be splitted to other toyyibPay users. This function is not available for billPriceSetting = 0 (dynamic bill).
billSplitPaymentArgs - [OPTIONAL] Provide JSON for split payment. e.g. [{"id":"johndoe","amount":"200"}]

*Please note that Split Payment is available for Online Banking (FPX) only.

billPaymentChannel - Set 0 for FPX, 1 Credit Card and 2 for both FPX & Credit Card.
billContentEmail - [OPTIONAL] Provide additional messages by sending an extra email to your customer. Limited to 1000 characters only.
billChargeToCustomer - [OPTIONAL] Below are the values available :
1. Leave blank to set charges for both FPX and Credit Card on bill owner.
2. Set "0" to charge FPX to customer.
* charge to customer is not available for card payment channel

billChargeToPrepaid - [OPTIONAL] Deducts the transaction charge from the prepaid account. Applicable only for FPX when charges are set to the bill owner.
billExpiryDate - [OPTIONAL] Date and time to set the bill as inactive (expired). Payer will not be able to make payment after the expiry date. Here is the datetime sample value: "17-12-2020 17:00:00".
billExpiryDays - [OPTIONAL] Number of day(s) to allow payment attempt to be made. The bill will be set to inactive after the number of day(s). The default expiry time will be at 23:59:59 on the final day. This parameter is ranged between minimum 1 day to maximum 100 days. The billExpiryDate parameter will be prioritised if both billExpiryDays and billExpiryDate parameters are set.
enableFPXB2B - [OPTIONAL] Set "1" to enable FPX (Corporate Banking) payment channel.
chargeFPXB2B - [OPTIONAL] Charge for FPX (Corporate Banking) payment channel :
1. Set "0" for charge to customer.
2. Set "1" for charge on bill owner.
* Default value is "1" which is charge on bill owner, if parameter "enableFPXB2B" is set to "1".

Our API system will return Bill Code in JSON format. In this example, the API return gcbhict9 as bill code. Hence, your payment url will be:- https://toyyibpay.com/gcbhict9

Sample code

<?php
  $some_data = array(
    'userSecretKey'=>'w5x7srq7-rx5r-3t89-2ou2-k7361x2jewhn',
    'categoryCode'=>'gcbhict9',
    'billName'=>'Car Rental WXX123',
    'billDescription'=>'Car Rental WXX123 On Sunday',
    'billPriceSetting'=>0,
    'billPayorInfo'=>1,
    'billAmount'=>100,
    'billReturnUrl'=>'http://bizapp.my',
    'billCallbackUrl'=>'http://bizapp.my/paystatus',
    'billExternalReferenceNo' => 'AFR341DFI',
    'billTo'=>'John Doe',
    'billEmail'=>'jd@gmail.com',
    'billPhone'=>'0194342411',
    'billSplitPayment'=>0,
    'billSplitPaymentArgs'=>'',
    'billPaymentChannel'=>'0',
    'billContentEmail'=>'Thank you for purchasing our product!',
    'billChargeToCustomer'=>1,
    'billExpiryDate'=>'17-12-2020 17:00:00',
    'billExpiryDays'=>3
  );  

  $curl = curl_init();
  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/createBill');  
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

  $result = curl_exec($curl);
  $info = curl_getinfo($curl);  
  curl_close($curl);
  $obj = json_decode($result);
  echo $result;
											
Sample result

[{"BillCode":"gcbhict9"}]
											

Callback Parameter
Please note that Callback URL cannot be received in localhost. Callback URL will be supplied with the following datas in POST format:-

refno : Payment reference no

status : Payment status. 1= success, 2=pending, 3=fail

reason : Reason for the status received

billcode : Your billcode / permanent link

order_id : Your external payment reference no, if specified

amount : Payment amount received

transaction_time : Datetime of the transaction status received.

Return URL Parameter
Return URL will be supplied with the following datas in GET format:-

status_id : Payment status. 1= success, 2=pending, 3=fail

billcode: Your billcode / permanent link

order_id : Your external payment reference no, if specified

Get Bill Transactions
You may check bill payment status by submitting Bill Code and Bill Payment Status(Optional). Bill payment status code description as follows:-

1 - Successful transaction
2 - Pending transaction
3 - Unsuccessful transaction
4 - Pending
Sample code

<?php
  $some_data = array(
    'billCode' => 'td8bfqv7',
    'billpaymentStatus' => '1'
  );  

  $curl = curl_init();

  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/getBillTransactions');  
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

  $result = curl_exec($curl);
  $info = curl_getinfo($curl);  
  curl_close($curl);

  echo $result;
?>
											
Sample result

[
    {
        "billName": "Payment_for_order_51",
        "billDescription": "Payment_for_order_51",
        "billTo": "Ali Bin Abu",
        "billEmail": "alibinabu@gmail.com",
        "billPhone": "0123456789",
        "billStatus": "1",
        "billpaymentStatus": "1",
        "billpaymentChannel": "FPX",
        "billpaymentAmount": "10.00",
        "billpaymentInvoiceNo": "TP5793119399122400030321",
        "billSplitPayment": "1",
        "billSplitPaymentArgs": "[{\"id\":\"toyyibPaySupport\",\"amount\":\"100\"}]",
        "billpaymentSettlement": "Settlement Done",
        "billpaymentSettlementDate": "2021-03-03 17:15:33",
        "SettlementReferenceNo": "TP030321956",
        "billPaymentDate": "02-03-2021 16:24:25",
        "billExternalReferenceNo": "WP0001"
    }
]
											
Get Category
In the example below, we will show you how to get category information. You need to pass the following parameters :

userSecretKey - User Secret Key
categoryCode - Category Code
Our API system will return information in JSON format.

Sample code

<?php
  $some_data = array(
    'userSecretKey' => 'w5x7srq7-rx5r-3t89-2ou2-k7361x2jewhn' //PROVIDE USER SECRET KEY HERE
    'categoryCode' => 'Ajdiufd345f' //PROVIDE CATEGORY CODE HERE
  );  

  $curl = curl_init();

  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/getCategoryDetails'); 
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

  $result = curl_exec($curl);

  $info = curl_getinfo($curl);  
  curl_close($curl);

  $obj = json_decode($result);
  echo $result;
											
Sample result

[
    {
        "categoryName": "Makanan",
        "categoryDescription": "Kuih Cara",
        "categoryStatus": "1"
    }
]
											
Inactive Bill
Use this API if you want to set your bill to inactive.

secretKey - Your toyyibPay account Secret Key
billCode - Bill Code of the bill.
There 3 responses for this function :

If bill is active and no pending transaction occuring.
If bill is active and has pending transaction process.
If bill is inactive
Sample code

<?php
  $some_data = array(
    'secretKey' => 'w5x7srq7-rx5r-3t89-2ou2-k7361x2jewhn', //PROVIDE USER SECRET KEY HERE
    'billCode' => 'a7usb2' //PROVIDE BILL CODE HERE
  );  

  $curl = curl_init();

  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/inactiveBill'); 
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

  $result = curl_exec($curl);

  $info = curl_getinfo($curl);  
  curl_close($curl);

  $obj = json_decode($result);
  echo $result;
											
Sample result


 {"status":"success","result":"Bill status changed to inactive"}

 or

 {"status":"failed","result":"Bill has pending transaction process"}

 or

 {"status":"failed","result":"Bill is inactive"}

											
APIs (Enterprise Partner)
Create User (For Enterprise Account Only)
This API will show how to create toyyibPay user from API. This API will return User Secret Key which later will be used for creating Category and Bill.

You need to pass the following parameters to create user.

enterpriseUserSecretKey - Enterprise user secret key
Fullname - User full name
User name - User name to access or login
* Max 30 alphanumeric characters, without space or special characters
Email - User Email OR User Id (not necessary in email format)
Password - User Password
Phone - User Phone
Bank Account Type - Set 1 for Personal Saving Account. Set 2 for Business / Company Current Account. Set 3 for Society / Organisation Current Account [default is 2]
Bank - User Bank Selection
Account No - User Bank Account No
Account Holder Name - User Account Holder Name
Registration No [OPTIONAL] - User Company / Business / Organization Registration No
Package - User Package
userStatus [OPTIONAL] - Set to 2 if you want the account status to be active without click the link in confirmation email.
Our API system will return User Secret Key in JSON format. It will return error if the email already exist.

Sample code

<?php
  $some_data = array(
    'enterpriseUserSecretKey' => 'abcdef-ghijk-lmnop-qrstu',
    'fullname' => 'John Doe Sdn Bhd',
    'username' => 'johndoe',
    'email' => 'hi@johndoe.com',
    'password' => '123456',
    'phone' => '0134342400',
    'bankAccountType' => '1',
    'bank'=>1,
    'accountNo'=>'162263282063',
    'accountHolderName'=>'John Doe,
    'registrationNo'=>'BBYUUI',
    'package' => 1
  );

  $curl = curl_init();
  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/createAccount');  
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

  $result = curl_exec($curl);
  $info = curl_getinfo($curl);  
  curl_close($curl);
  $obj = json_decode($result);
  echo $result;
									
Sample result

[
  {
  	"UserSecretKey" : "vrbl86xf-wj1h-q0l3-95kk-4q4erulvsc0h"
  }
]
									
Get Bank
Get Bank API is useful for you to get bank information which are accepted to be used with toyyibPay. Bank information is required when you create a user from API

Our API system will return bank information in JSON format.

Sample code

<?php
  $curl = curl_init();

  curl_setopt($curl, CURLOPT_POST, 0);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/getBank');  
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

  $result = curl_exec($curl);
  $info = curl_getinfo($curl);  
  curl_close($curl);

  echo $result;
?>
										
Sample result

[{"id":"2","bank":"CIMB Bank","status":"1"},{"id":"3","bank":"Bank Islam","status":"1"},{"id":"4","bank":"Public Bank","status":"1"},{"id":"5","bank":"Hong Leong Bank","status":"1"},{"id":"6","bank":"RHB Bank","status":"1"},{"id":"7","bank":"Ambank","status":"1"},{"id":"8","bank":"Bank Rakyat","status":"1"},{"id":"9","bank":"Alliance Bank","status":"1"},{"id":"10","bank":"Affin Bank","status":"1"},{"id":"11","bank":"Bank Muamalat","status":"1"},{"id":"12","bank":"Bank Simpanan Nasional","status":"1"},{"id":"13","bank":"Standard Chartered","status":"1"},{"id":"14","bank":"OCBC Bank","status":"1"},{"id":"15","bank":"Agro Bank","status":"1"},{"id":"16","bank":"UOB Bank","status":"1"},{"id":"17","bank":"HSBC","status":"1"},{"id":"18","bank":"Kuwait Finance House","status":"1"},{"id":"21","bank":"Al Rajhi Bank","status":"1"},{"id":"22","bank":"Citibank Berhad","status":"1"},{"id":"23","bank":"Maybank","status":"1"},{"id":"24","bank":"MBSB Bank","status":"1"}]
										
Get User Status (For Enterprise Account Only)
You may check user account status by submitting user email and enterprise user secret key. Status code description as follows:-

0 - Inactive
1 - New-Pending Approval
2 - Active
Sample code

<?php
  $some_data = array(
    'username' => 'johndoe',
    'enterpriseUserSecretKey' => 'h9ijfq4y-hrha-jsmj-s4br-r5hll1g29ty'
  );  

  $curl = curl_init();

  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/index.php/api/getUserStatus');  
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

  $result = curl_exec($curl);

  $info = curl_getinfo($curl);  

  curl_close($curl);
  echo $result;
?>
										
Sample result

[{"status":"1"}]
										
Get Settlement Summary
You may get all settlement summary information by submitting as follows:-

userSecretKey - Secret key for Enterprise User Only
userName - Sample Username
Sample code

<?php
$some_data = array(
'userSecretKey' => 'td8bfqv7',
'userName' => "Sample Username"
);  

$curl = curl_init();

curl_setopt($curl, CURLOPT_POST, 1);
curl_setopt($curl, CURLOPT_URL, 'https://toyyibpay.com/api/getSettlementSummary');  
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, $some_data);

$result = curl_exec($curl);
$info = curl_getinfo($curl);  
curl_close($curl);

echo $result;
?>
				
Sample Result

[
	{
		"userID": "44",
		"userName": "fitweb",
		"today": "19-10-31",
		"Amount_Pending": "1.00",
		"Amount_settle": "5.00",
		"AmountNett_Pending": "1.00",
		"AmountNett_Settle": "0.00",
		"Different_Pending": "0.00",
		"Different_Settle": "5.00",
		"Standard_Pending": "0.00",
		"Standard_Settle": "0.00",
		"Santai_Pending": "1.00",
		"Santai_Settle": "5.00",
		"Creditcard_Pending": "0.00",
		"Creditcard_settle": "0.00",
		"Transaction_Pending": "6",
		"Trnsaction_Settle": "6"
	}
]
					