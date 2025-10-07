<?php
/**
 * Plugin Name: EasyParcel Shipping
 * Plugin URI: https://easyparcel.com/
 * Description: EasyParcel Shipping plugin allows you to enable order fulfillment without leaving your store and allow your customer to pick their preferable courier during check out. To get started, activate EasyParcel Shipping plugin and proceed to Woocommerce > Settings > Shipping > EasyParcel Shipping to set up your Integration ID. ⚠️ Notice ~ if facing any fulfilment duplication please update to version 1.0.22 or later to avoid this issue.
 * Version: 1.0.25
 * Author: EasyParcel
 * Author URI: https://www.easyparcel.com/
 * Text Domain: easyparcel-shipping
 * WC requires at least: 4
 * WC tested up to: 8.3
 *
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 *
 * EasyParcel Shipping is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * any later version.
 *
 * EasyParcel Shipping is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EasyParcel Shipping. If not, see http://www.gnu.org/licenses/gpl-3.0.html.
**/

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}
global $jal_db_version;
$jal_db_version = '1.0';

define( 'EASYPARCEL_VERSION', '1.0.25' );

define( 'EASYPARCEL__FILE__'            ,  __FILE__  );
define( 'EASYPARCEL_PLUGIN_BASE'        , plugin_basename( __FILE__ ) );
define( 'EASYPARCEL_PATH'               , plugin_dir_path( __FILE__ ) );
define( 'EASYPARCEL_URL'                , plugins_url( '/', __FILE__ ) );

define( 'EASYPARCEL_SERVICE_PATH'       , EASYPARCEL_PATH . 'include/service/' );
define( 'EASYPARCEL_DATASTORE_PATH'     , EASYPARCEL_PATH . 'include/data_store/' );

define( 'EASYPARCEL_MODULE_PATH'        , EASYPARCEL_PATH . 'include/module/' );
define( 'EASYPARCEL_MODULE_URL'         , EASYPARCEL_URL . 'include/module/' );

if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    include_once EASYPARCEL_PATH . 'database/create.php';

    if (!class_exists('EP_EasyParcel')){
        include_once EASYPARCEL_PATH . 'include/EP_EasyParcel.php';
    }
    $easyparcel = new EP_EasyParcel();
    
    
}

?>
