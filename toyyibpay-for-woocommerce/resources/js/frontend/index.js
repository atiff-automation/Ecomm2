import { __ } from '@wordpress/i18n';
import { registerPaymentMethod } from '@woocommerce/blocks-registry';
import { decodeEntities } from '@wordpress/html-entities';
import { getSetting } from '@woocommerce/settings';

const settings = getSetting( 'toyyibpay_data', {} );

const defaultLabel = __('ToyyibPay', 'tfw');

const label = decodeEntities( settings.title ) || defaultLabel;

// Content component
const Content = () => {
	return decodeEntities( settings.description || '' );
};

// Label component
const Label = ( props ) => {
	const { PaymentMethodLabel } = props.components;
	return <PaymentMethodLabel text={ label } />;
};

// Payment method config object
const ToyyibPay = {
	name: settings.name,
	label: <Label />,
	content: <Content />,
	edit: <Content />,
	canMakePayment: () => true,
	ariaLabel: label,
	supports: {
		features: settings.supports,
	},
};

registerPaymentMethod( ToyyibPay );
