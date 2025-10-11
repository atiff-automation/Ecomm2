<?php

function bill_inquiry($billCode, $OrderId) {

    $order 			= wc_get_order($OrderId);
    $old_wc 		= version_compare(WC_VERSION, '3.0', '<');
    $order_id 		= $old_wc ? $order->id : $order->get_id();

    $settings = get_option('woocommerce_toyyibpay_settings');

    $is_sandbox = $settings['enabledev'];
    if ($is_sandbox == "no") {

        $requery 			= 'https://toyyibpay.com/index.php/api/getBillTransactions';
    } else {

        $requery 			= 'https://dev.toyyibpay.com/index.php/api/getBillTransactions';
    }

    $post_check = array(
        'body' => array(
            'billCode' 			=> $billCode,
            'billpaymentStatus' => '1'
        )
    );

    $request 	= wp_remote_post($requery, $post_check);
    $response 	= wp_remote_retrieve_body($request);
    $arr 		= json_decode($response, true);

    if ($order->get_status() == "pending" && $arr[0]["billpaymentStatus"] == "1") {
        $order->payment_complete();
        $order->add_order_note('Payment successfully made via toyyibPay :)<br> 
        Ref. No: ' . $arr[0]["billpaymentInvoiceNo"] . '
        <br>Bill Code: ' . $billCode . '
        <br>Order ID: ' . $OrderId);

        return;
    } else {
        return;
    }
}
add_action('bill_inquiry', 'bill_inquiry', 0, 2);
