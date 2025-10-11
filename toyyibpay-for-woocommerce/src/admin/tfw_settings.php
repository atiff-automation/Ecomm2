<?php

defined('ABSPATH') || exit;

function tfw_get_settings() {
    $saved_settings = get_option('woocommerce_toyyibpay_settings');

    $settings = array();

    $settings['enabled'] = array(
        'title'   => __('Enable / Disable', 'tfw'),
        'label'   => __('Enable this payment gateway', 'tfw'),
        'type'    => 'checkbox',
        'default' => 'no',
		'description' => __("<span style='color:red'>toyyibPay require customer's phone number during the Checkout process. Please set 'Required' to the Phone Number field in your Checkout Page.</span>", 'tfw'),
    );

    $settings['title'] = array(
        'title'    => __('Title', 'tfw'),
        'type'     => 'text',
        'default'  => __('toyyibPay', 'tfw'),
    );

    $settings['description']  = array(
        'title'    => __('Description', 'tfw'),
        'type'     => 'textarea',
        'default'  => __('Pay securely with toyyibPay.', 'tfw'),
        'css'      => 'max-width:350px;',
    );

    $settings['display_logo'] = array(
        'title' => __('Checkout Logo', 'tfw'),
        'default' => 'horiz',
        'class' => 'wc-enhanced-select',
        'type' => 'select',
        'desc_tip' => false,
        'options' => array(
            'mini' => 'Minimal',
            'horiz' => 'Horizontal',
            'verti' => 'Vertical'
        ),
    );	

    $settings['secretkey_prod'] = array(
        'title'    => __('User SecretKey', 'tfw'),
        'type'     => 'text',
        'desc_tip' => __('Required', 'tfw'),
        'description' => __('Obtain your secret key from your toyyibPay dashboard.', 'tfw'),
    ); 

    $settings['universal_category_prod'] = array(
        'title'    => __('Category Code', 'tfw'),
        'type'     => 'text',
        'desc_tip' => __('Required', 'tfw'),
        'description' => __('Create a category at your toyyibPay dashboard and fill in your category code here.', 'tfw'),
    );

    $settings['checkout'] = array(
        'title' => __('Checkout Settings', 'tfw'),
        'type' => 'title',
        'description' => '',
    );

    $settings['universal_channel']  = array(
        'title'   => __('Payment Channel', 'tfw'),
        'label'   => __('Payment Channel Options', 'tfw'),
        'description' => 'Choose your preferred payment channel - FPX and/or credit cards.',
        'type'    => 'select',
        'options' => array(
            '0' => 'FPX only',
            '1' => 'Credit/Debit Card only',
            '2' => 'FPX and Credit/Debit Card'
        ),
    );

    $settings['universal_charge'] = array(
        'title'   => __('Transaction Charges', 'tfw'),
        'label'   => __('Transaction Charges Options', 'tfw'),
        'description' => __('Choose payer for transaction charges.', 'tfw'),
        'type'    => 'select',
        'options' => array(
            '0' => 'Charge included in bill amount',
            '1' => 'Charge the Online Banking transaction charge on the customer',
        ),
    );

    $settings['content_email'] = array(
        'title'    => __('Extra e-mail content (Optional)', 'tfw'),
        'type'     => 'textarea',
        'desc_tip' => __('', 'tfw'),
        'description' => 'Content of additional e-mail to be sent to your customers (Optional - leave this blank if you are not sure what to write).',
        'default'  => __('', 'tfw'),
        'css'      => 'max-width:350px;',
    );

    $settings['split'] = array(
        'title' => __('Split Payment', 'tfw'),
        'type' => 'title',
        'description' => __('Enable this feature only if you wish to split the received payment amount from your customer to other toyyibPay account. Do not enable this if you are not sure or do not want to split the received amount.', 'tfw'),
    );

    $settings['enablesplit'] = array(
        'title' => __('Enable/Disable ', 'tfw'),
        'type' => 'checkbox',
        'label' => __('Enable Split Payment', 'tfw'),
        'description' => 'By enabling Split Payment, The transaction amount will be splitted to another (1) toyyibPay account.',
        'default' => 'no',
    );

    $settings['splitmethod'] = array(
        'title'   => __('Split method', 'tfw'),
        'label'   => __('Split Method Options', 'tfw'),
        'description' => __('Choose to split by percentage or fix amount.', 'tfw'),
        'type'    => 'select',
        'options' => array(
            '0' => 'Percentage',
            '1' => 'Fix amount'
        ),
    );

    $settings['splitusername'] = array(
        'title'    => __('Receiver Username', 'tfw'),
        'description' => __('Username of the toyyibPay account (1 username only - not your account username).', 'tfw'),
        'type'     => 'text',
    );

    $settings['splitpercent'] = array(
        'title'    => __('Split Percentage (%)', 'tfw'),
        'description' => __('Enter the percentage to split (Numbers only between 1 to 90).', 'tfw'),
        'type'     => 'number',
    );

    $settings['splitfixamount'] = array(
        'title'    => __('Split Fix Amount', 'tfw'),
        'description' => __('Enter the fix amount to split (Numbers only, split will occur if this amount is less than the total checkout amount by customers).', 'tfw'),
        'type'     => 'number',
    );

    $settings['develop'] = array(
        'title' => __('Development Mode', 'tfw'),
        'type' => 'title',
        'description' => __('This is for testing purposes. Please create an account in <a href="https://dev.toyyibpay.com">dev.toyyibpay.com</a> if you does not have one.<br>Use these banks only for testing in sandbox<br><b>SBI Bank A for success payments.</b><br><b>SBI Bank B for fail payments.</b><br><b>SBI Bank C for random possibilities.</b><br>(Username: 1234, Password: 1234)', 'tfw'),
    );

    $settings['enabledev'] = array(
        'title' => __('Enable/Disable ', 'tfw'),
        'type' => 'checkbox',
        'label' => __('Enable Development Mode', 'tfw'),
        'description' => 'By enabling development mode, you will redirect to dev.toyyibpay.com instead of toyyibpay.com.',
        'default' => 'no',
    );

    $settings['secretkey_dev']  = array(
        'title'    => __('User Secret Key Dev', 'tfw'),
        'description' => __('Fill in your development secret key here.', 'tfw'),
        'type'     => 'text',
        'desc_tip' => __('Obtain your secret key from your development acccount.', 'tfw'),
    ); 
	
    $settings['universal_category_dev'] = array(
        'title'    => __('Category Code', 'tfw'),
        'description' => __('Fill in your development category code here.', 'tfw'),
        'type'     => 'text',
        'desc_tip' => __('Obtain your category code from your development acccount.', 'tfw'),
    );

    $settings['splitusername_dev'] = array(
        'title'    => __('Split Receiver Username', 'tfw'),
        'description' => __('Username of the toyyibPay sandbox account (1 username only - not your account username).', 'tfw'),
        'type'     => 'text',
    );

    return $settings;
}


function tfw_get_settings_defaults() {
    $settings = tfw_get_settings();
    $defaults = array();

    foreach ($settings as $key => $value) {
        if (isset($value['default'])) {
            $defaults[$key] = $value['default'];
        } else {
            $defaults[$key] = null;
        }
    }

    return $defaults;
}
