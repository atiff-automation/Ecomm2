<?php

defined('ABSPATH') || exit;

function toyyibpay_links($actions)
{
    $new_actions = array(
      'settings' => sprintf(
        '<a href="%1$s">%2$s</a>', admin_url('admin.php?page=wc-settings&tab=checkout&section=toyyibpay'), esc_html__('Settings', 'tfw')
      )
    );
    return array_merge($new_actions, $actions);
}
add_filter('plugin_action_links_' . TFW_BASENAME, 'toyyibpay_links'); 