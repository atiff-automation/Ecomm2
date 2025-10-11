<?php
/**
 * Plugin Name: toyyibPay for WooCommerce
 * Plugin URI: https://wordpress.org/plugins/toyyibpay-for-woocommerce/#installation
 * Description: Integrate your WooCommerce site with toyyibPay Payment Gateway.
 * Version: 1.4.0
 * Author: toyyibPay
 * Author URI: https://toyyibpay.com
 * tested up to: 6.4.2
 **/

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

define('TFW_PLUGIN_VER', '1.4.0');
define('TFW_MIN_PHP_VER', '7.0');
define('TFW_MIN_WOOCOMMERCE_VER', '7.0');
define('TFW_PLUGIN_FILE', __FILE__);
define('TFW_PLUGIN_DIR', dirname(TFW_PLUGIN_FILE));
define('TFW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('TFW_BASENAME', plugin_basename(TFW_PLUGIN_FILE));

# Include toyyibPay Class and register Payment Gateway with WooCommerce
add_action('admin_init', 'check_environment');

add_action( 'plugins_loaded', 'toyyibpay_init', 0 );

add_action('woocommerce_blocks_loaded', 'blocks_support');

function toyyibpay_init() {
	/* if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
		return;
	} */
	
	if (!class_exists('WooCommerce')) {
      return false;
    }
	
	if (is_admin()) {
		include TFW_PLUGIN_DIR . '/src/admin/tfw_action_links.php';
		include TFW_PLUGIN_DIR . '/src/admin/tfw_settings.php';
	}

	include TFW_PLUGIN_DIR . '/src/wc_toyyibpay_gateway.php';
	include TFW_PLUGIN_DIR . '/src/wc_requery_bill.php';

}

function blocks_support() {
	if ( class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
		include TFW_PLUGIN_DIR . '/src/wc_toyyibpay_blocks_support.php';

		add_action(
		'woocommerce_blocks_payment_method_type_registration',
		function( Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry ) {
			$payment_method_registry->register( new WC_ToyyibPay_Blocks_Support() );
		}
		);
	}
}
	
function check_environment() {
    $environment_warning = get_environment_warning();
    if ($environment_warning && is_plugin_active(TFW_BASENAME)) {
      deactivate_plugins(TFW_BASENAME);
      $this->add_admin_notice('bad_environment', 'error', $environment_warning);
      if (isset($_GET['activate'])) {
        unset($_GET['activate']);
      }
    }
    $is_woocommerce_active = class_exists('WooCommerce');
    if (is_admin() && current_user_can('activate_plugins') && !$is_woocommerce_active) {
      $this->add_admin_notice('prompt_tfw_activate', 'error', sprintf(__('<strong>Activation Error:</strong> You must have the <a href="%s" target="_blank">WooCommerce</a> plugin installed and activated for ToyyibPay to activate.', 'tfw'), 'https://woocommerce.com'));
      deactivate_plugins(TFW_BASENAME);
      if (isset($_GET['activate'])) {
        unset($_GET['activate']);
      }
      return false;
    }
    if (defined('WC_VERSION') && version_compare(WC_VERSION, TFW_MIN_WOOCOMMERCE_VER, '<')) {
      $this->add_admin_notice('prompt_woocommerce_version_update', 'error', sprintf(__('<strong>Activation Error:</strong> You must have the <a href="%s" target="_blank">WooCommerce</a> core version %s+ for the ToyyibPay for WooCommerce add-on to activate.', 'tfw'), 'https://woocommerce.com', TFW_MIN_WOOCOMMERCE_VER));
      deactivate_plugins(TFW_BASENAME);
      if (isset($_GET['activate'])) {
        unset($_GET['activate']);
      }
      return false;
    }
}

function get_environment_warning($during_activation = false) {
    if (version_compare(phpversion(), TFW_MIN_PHP_VER, '<')) {
      if ($during_activation) {
        $message = __('The plugin could not be activated. The minimum PHP version required for this plugin is %1$s. You are running %2$s. Please contact your web host to upgrade your server\'s PHP version.', 'tfw');
      } else {
        $message = __('The plugin has been deactivated. The minimum PHP version required for this plugin is %1$s. You are running %2$s.', 'tfw');
      }
      return sprintf($message, TFW_MIN_PHP_VER, phpversion());
    }

    if (!class_exists('WC_Payment_Gateway')) {
      if ($during_activation) {
        return __('The plugin could not be activated. ToyyibPay for WooCommerce depends on the last version of <a href="http://wordpress.org/extend/plugins/woocommerce/">WooCommerce</a> to work.', 'tfw');
      }
      return __('The plugin has been deactivated. ToyyibPay for WooCommerce depends on the last version of <a href="http://wordpress.org/extend/plugins/woocommerce/">WooCommerce</a> to work.', 'tfw');
    }

    return false;
}

function add_admin_notice($slug, $class, $message)
{
	$this->notices[$slug] = array(
		'class' => $class,
		'message' => $message,
	);
}

add_action( 'init', 'toyyibpay_check_response', 15 );

function toyyibpay_check_response() {
	# If the parent WC_Payment_Gateway class doesn't exist it means WooCommerce is not installed on the site, so do nothing
	if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
		return;
	}
	
	include_once( 'src/wc_toyyibpay_gateway.php' );

	$toyyibpay = new WC_ToyyibPay_Gateway();
	$toyyibpay->check_toyyibpay_response();
	$toyyibpay->check_toyyibpay_callback();
	
} 

add_filter('https_ssl_verify', '__return_false');