<?php

defined('ABSPATH') || exit;

function ty_add_gateway($methods)
{
  $methods[] = 'WC_ToyyibPay_Gateway';
  return $methods;
}

add_filter('woocommerce_payment_gateways', 'ty_add_gateway');


class WC_ToyyibPay_Gateway extends WC_Payment_Gateway
{
    public static $log_enabled = false;
    public static $log = false;

    public static $gateway_id = 'toyyibpay';

    private $error_messages = array();

    public function __construct()
    {
		
        $this->id = self::$gateway_id;
        $this->method_title = __("toyyibPay", 'tfw');
		$this->method_description = __("Enable your customers to make payments securely via toyyibPay.", 'tfw');
        $this->title = __("toyyibPay", 'tfw');
        $this->order_button_text =  __('Pay with ToyyibPay', 'tfw');

    
        if (is_admin()){
		  $this->init_form_fields();
		}

		$this->init_settings();
		$this->has_fields = true;

		foreach ($this->settings as $setting_key => $value) {
			$this->$setting_key = $value;
		} 
		
		if (is_admin()) {
			add_action('woocommerce_update_options_payment_gateways_' . $this->id, array(
				$this,
				'process_admin_options'
			));
		}

		$this->woocommerce_add_action();
    
    } 
	
	private function woocommerce_add_action()
	{		
		add_action('woocommerce_api_callback', 'check_toyyibpay_callback');		
	}
	

    # Build the administration fields for this specific Gateway
	public function init_form_fields()

	{
		$this->form_fields = apply_filters('tfw_form_fields', tfw_get_settings());
	}
	
	
	# Submit payment
	public function process_payment($order_id)

	{			
		global $woocommerce;
		# Get this order's information so that we know who to charge and how much
		$customer_order = wc_get_order($order_id);

		$settings = get_option('woocommerce_toyyibpay_settings');
		# Prepare the data to send to toyyibPay

		$billName = "Order No " . $order_id;
		$description = "Payment for Order No " .  $order_id;
		$payChannel = $settings['universal_channel'];
		$extraEmail = $settings['content_email'];
		$callbackURL = wc_get_endpoint_url('order-received', '', wc_get_checkout_url());	

		$universal_charge = $settings['universal_charge'];

		if ($universal_charge == "0") {
			$billTransactionCharge = '';
		} else {
			$billTransactionCharge = '0';
		}

		$order_id = $customer_order->get_id();
		$amount   = $customer_order->get_total();
		$name     = $customer_order->get_billing_first_name() . ' ' . $customer_order->get_billing_last_name();
		$email    = $customer_order->get_billing_email();
		$phone    = $customer_order->get_billing_phone();
		$returnURL = wc_get_endpoint_url('order-received', '', wc_get_checkout_url());	

		if ($name == NULL || $phone == NULL || $email == NULL) {
			wc_add_notice('Error! Please complete your details (Name, phone, and e-mail are compulsory).', 'error');
			return;
		} 
		

		# Create bill API from toyyibpay

		if ($settings['enabledev'] == "no") {

			$secretkey = $settings['secretkey_prod'];
			$categorycode = $settings['universal_category_prod'];
			$url = 'https://toyyibpay.com/index.php/api/createBill';
			$redirect = "https://toyyibpay.com/";
		} else {

			$secretkey = $settings['secretkey_dev'];
			$categorycode = $settings['universal_category_dev'];
			$url = 'https://dev.toyyibpay.com/index.php/api/createBill';
			$redirect = "https://dev.toyyibpay.com/";
		}

		if ($settings['enablesplit'] == "no") {
			$enableSplit = '0';
		} else {
			$enableSplit = '1';
		}

		if ($enableSplit == '1') {

			if ($settings['enabledev'] == "no") {
				$splitusername = $settings['splitusername'];
			} else {
				$splitusername = $settings['splitusername_dev'];
			}

			if ($settings['splitmethod'] == 0 || $settings['splitmethod'] == '0') {
				$splitAmount = ($settings['splitpercent'] / 100) * $amount;
			} else {
				$splitAmount = $settings['splitfixamount'];
			}

			$splitArgs = '[{"id":"' . $splitusername . '","amount":"' . $splitAmount * 100 . '"}]';
		} else {
			$splitArgs = '';
		}
		
		$post_args = array(
			'body' => array(
				'userSecretKey' 			=> $secretkey,
				'categoryCode' 				=> $categorycode,
				'billName' 					=> $billName,
				'billDescription' 			=> $description,
				'billPriceSetting'			=>	1,
				'billPayorInfo'				=>	1,
				'billAmount'				=>	$amount * 100,
				'billReturnUrl'				=>	$returnURL,
				'billCallbackUrl'			=>	$callbackURL,
				'billExternalReferenceNo' 	=>	$order_id,
				'billTo'					=>	$name,
				'billEmail'					=>	$email,
				'billPhone'					=>	$phone,
				'billSplitPayment'			=>	$enableSplit,
				'billSplitPaymentArgs'		=>	$splitArgs,
				'billPaymentChannel'		=>	$payChannel,
				'billDisplayMerchant'		=>	1,
				'billContentEmail'			=>	$extraEmail,
				'billChargeToCustomer'		=>	$billTransactionCharge,
				'billASPCode'				=>  'toyyibPay-V1-WCV1.4.0'
			)
		);
		

		$request 	= wp_remote_post($url, $post_args);
		$response 	= wp_remote_retrieve_body($request);
		$arr 		= json_decode($response, true);
		$billCode 	= $arr[0]['BillCode'];

		$order_note = wc_get_order($order_id);

		if ($billCode == NULL) {

			$arr = [json_decode($response, true)];
			$msg = $arr[0]['msg'];

			if ($msg == NULL) {
				wc_add_notice('Error!<br>Please check the following : ' . $response, 'error');
			} else {
				wc_add_notice('Error!<br>Please check the following : ' . $msg, 'error');
			}

			return;
		} else {
			$arguments = array($billCode, $order_id);
			date_default_timezone_set("Asia/Kuala_Lumpur");

			wp_schedule_single_event(strtotime("+ 3 minutes"), 'bill_inquiry', $arguments);

			$order_note->add_order_note('Customer made a payment attempt via toyyibPay.<br>Bill Code : ' . $billCode . '<br>You can check the payment status of this bill in toyyibPay account.');

			return array(
				'result'   => 'success',
				'redirect' => $redirect . $billCode
			);
		} 
	}

	public static function get_listener_url($order_id) {

		$arg = array(
			'order'       => $order_id,
			'message_type' => 'toyyibpay_bill_callback'
		);
		return add_query_arg($arg, site_url('/'));
	}
	
	public function check_toyyibpay_response()
	{

		if (isset($_REQUEST['status_id']) && isset($_REQUEST['billcode']) && isset($_REQUEST['order_id']) && isset($_REQUEST['msg']) && isset($_REQUEST['transaction_id'])) {
			global $woocommerce;

			$is_callback = isset($_POST['order_id']) ? true : false;
			$order = wc_get_order($_REQUEST['order_id']);
			$old_wc = version_compare(WC_VERSION, '3.0', '<');
			$order_id = $old_wc ? $order->id : $order->get_id();

			if ($order && $order_id != 0) {

				if ($_REQUEST['status_id'] == 1 || $_REQUEST['status_id'] == '1') {

					if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending' || strtolower($order->get_status()) == 'processing') {

						wp_redirect($order->get_checkout_order_received_url());
					}
				} elseif ($_REQUEST['status_id'] == 3 || $_REQUEST['status_id'] == '3') {
					if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending' || strtolower($order->get_status()) == 'processing') {

						wp_redirect(wc_get_checkout_url());
						wc_add_notice('Payment was declined.<br> Reason: Bank error / insuficient fund', 'error');
					}
				} else {
					if (strtolower($order->get_status()) == 'pending' || strtolower($order->get_status()) == 'processing') {

						wp_redirect(wc_get_checkout_url());
						wc_add_notice('Payment was declined.<br> Reason: Payment is pending, please contact site admin to get your payment status', 'error');
					}
				}
			}
		}
	}
	
	# Validate fields, do nothing for the moment
	public function validate_fields()

	{
		return true;
	}
	
	# Check if we are forcing SSL on checkout pages, Custom function not required by the Gateway for now
	public function do_ssl_check()
	{
		$settings = get_option('woocommerce_toyyibpay_settings');

		if ($settings['enabled'] == "yes") {
			if (get_option('woocommerce_force_ssl_checkout') == "no") {
				echo "<div class=\"error\"><p>" . sprintf(__("<strong>%s</strong> is enabled and WooCommerce is not forcing the SSL certificate on your checkout page. Please ensure that you have a valid SSL certificate and that you are <a href=\"%s\">forcing the checkout pages to be secured.</a>"), $this->method_title, admin_url('admin.php?page=wc-settings&tab=checkout')) . "</p></div>";
			}
		}
	}
	
	/**

	 * Check if this gateway is enabled and available in the user's country.
	 * Note: Not used for the time being
	 * @return bool
	 */
	
	public function is_valid_for_use()
	{
		return in_array(get_woocommerce_currency(), array('MYR'));
	}
	
	public function check_toyyibpay_callback()
	{
		$settings = get_option('woocommerce_toyyibpay_settings'); 

		if ($settings['enabledev'] == "no") {
			$secretkey = $settings['secretkey_prod'];
		} else {
			$secretkey = $settings['secretkey_dev'];
		}

		if (isset($_REQUEST['status']) && isset($_POST['billcode']) && isset($_REQUEST['order_id']) && isset($_REQUEST['reason']) && isset($_REQUEST['refno'])) {

			global $woocommerce;
			$order = wc_get_order($_REQUEST['order_id']);
			$old_wc = version_compare(WC_VERSION, '3.0', '<');
			$order_id = $old_wc ? $order->id : $order->get_id();
			if ($order && $order_id != 0) {

				$userSecretKey  = $secretkey;
				$payStatus     	= $_POST['status'];
				$extRef     	= $_POST['order_id'];
				$transactId   	= $_POST['refno'];
				$hashval     	= md5($userSecretKey . $payStatus . $extRef . $transactId . "ok");

				if ($hashval == $_POST['hash']) {
					if ($_REQUEST['status'] == 1 || $_REQUEST['status'] == '1') {

						if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending' || strtolower($order->get_status()) == 'processing') {

							if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending') {
								$order->add_order_note('Payment is successfully made through toyyibPay!<br> 
								Ref. No: ' . $_REQUEST['refno'] . '
								<br>Bill Code: ' . $_REQUEST['billcode'] . '
                                <br>Order ID: ' . $order_id);
								$order->payment_complete();
							}
						}
					} elseif ($_REQUEST['status'] == 3 || $_REQUEST['status'] == '3') {
						if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending' || strtolower($order->get_status()) == 'processing') {

							if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending') {
								$order->add_order_note('Payment attempt was failed.<br> 
								Ref. No: ' . $_REQUEST['transaction_id'] . '
								<br>Bill Code: ' . $_REQUEST['billcode'] . '
								<br>Order ID: ' . $order_id . '
								<br>Reason: ' . $_REQUEST['reason']);
							}
						}
					} else {
						if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending') {

							if ($settings['enabledev'] == "no") {
								$urlCheck = 'https://toyyibpay.com/index.php/api/getBillTransactions';
							} else {
								$urlCheck = 'https://dev.toyyibpay.com/index.php/api/getBillTransactions';
							}
							$post_check = array(
								'body' => array(
									'billCode' 			=> $_REQUEST['billcode'],
									'billpaymentStatus' => '1'
								)
							);

							$requestCheck = wp_remote_post($urlCheck, $post_check);
							$responseCheck = wp_remote_retrieve_body($requestCheck);
							$arrCheck = json_decode($responseCheck, true);
							$billpaymentStatus = $arrCheck[0]['billpaymentStatus'];

							if ($billpaymentStatus == 1 || $billpaymentStatus == "1") {

								$order->add_order_note('Payment successfully made through toyyibPay!<br> 
									Ref. No: ' . $_REQUEST['transaction_id'] . '
									<br>Bill Code: ' . $_REQUEST['billcode'] . '
									<br>Order ID: ' . $order_id);
								$order->payment_complete();
								
							} elseif ($billpaymentStatus == 3 || $billpaymentStatus == "3") {
								if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending' || strtolower($order->get_status()) == 'processing') {

									if (strtolower($order->get_status()) == 'pending') {
										$order->add_order_note('Payment attempt was failed.<br> 
                                            Ref. No: ' . $_REQUEST['transaction_id'] . '
                                            <br>Bill Code: ' . $_REQUEST['billcode'] . '
                                            <br>Order ID: ' . $order_id . '
                                            <br>Reason: ' . $_REQUEST['reason']);
									}
								}
							} else {
								if (strtolower($order->get_status()) == 'cancelled' || strtolower($order->get_status()) == 'pending' || strtolower($order->get_status()) == 'processing') {

									if (strtolower($order->get_status()) == 'pending') {
										$order->add_order_note('Payment status pending. Please check in your toyyibPay account for the latest status.<br> 
                                            Ref. No: ' . $_REQUEST['transaction_id'] . '
                                            <br>Bill Code: ' . $_REQUEST['billcode'] . '
                                            <br>Order ID: ' . $order_id . '
                                            <br>Reason: ' . $_REQUEST['reason']);
									}
								}
							}
						}
					}
				} else {

					$order->add_order_note('Payment attempt was failed.<br> 
							Ref. No: ' . $_REQUEST['transaction_id'] . '
							<br>Bill Code: ' . $_REQUEST['billcode'] . '
							<br>Order ID: ' . $order_id . '
							<br>Reason: Payment has failed to complete.');
				}
			}
		}
	}

  

 
}