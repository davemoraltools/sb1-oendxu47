import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isValidCatalunyaLocation, CATALUNYA_LOCATIONS } from '../data/locations';
import IngredientsModal from './IngredientsModal';

type PackageRange = '10-15' | '16-20' | '20-25' | '25+' | '40+';
type PaellaCategory = 'meat' | 'seafood' | 'verdures' | 'fideua';

interface Package {
  id: string;
  name: string;
  pricePerPerson: number;
  description: string;
}

interface PaellaSelection {
  category: PaellaCategory | '';
  variety: string;
  portions: string;
}

interface Order {
  guests: number;
  package: string;
  numDifferentPortions: number;
  paellaSelections: PaellaSelection[];
  seafoodExtras: string[];
  extras: string[];
  fullName: string;
  email: string;
  phone: string;
  date: string;
  city: string;
  address: string;
  timeSlot: string;
  requestCustomQuote: boolean;
  comments: string;
}

const TIME_SLOTS = [
  { id: 'midday', name: 'labels.midday' },
  { id: 'evening', name: 'labels.evening' },
];

const STEPS = [
  { title: 'steps.comensales' },
  { title: 'steps.eligePack' },
  { title: 'steps.selectPaella' },
  { title: 'steps.assignPortions' },
  { title: 'steps.extras' },
  { title: 'steps.detalles' },
  { title: 'steps.resumen' },
];

const stepDescriptions = [
  'descriptions.descriptionComensales',
  'descriptions.descriptionEligePack',
  'descriptions.descriptionSelectPaella',
  'descriptions.descriptionAssignPortions',
  'descriptions.descriptionExtras',
  'descriptions.descriptionDetalles',
  'descriptions.descriptionResumen',
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatPrice = (price: number): string => {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
};

const Calculator: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const PAELLA_CATEGORIES = t('labels.paellaCategories', { returnObjects: true }) as Record<PaellaCategory, string>;
  const PAELLA_VARIETIES = t('packs.paellaVarieties', { returnObjects: true }) as Record<
    PaellaCategory,
    { id: string; name: string; ingredients: string }[]
  >;
  const SEAFOOD_EXTRAS = t('packs.seafoodExtrasList', { returnObjects: true }) as {
    id: string;
    name: string;
    description: string;
    price: number;
  }[];
  const EXTRAS = t('packs.extrasList', { returnObjects: true }) as {
    id: string;
    name: string;
    description: string;
    price: number;
  }[];
  const PACKAGES = t('packs.packages', { returnObjects: true }) as Record<PackageRange, Package[]>;

  const [currentStep, setCurrentStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [cityError, setCityError] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [modalData, setModalData] = useState<{ title: string; ingredients: string } | null>(null);
  const [isAllSame, setIsAllSame] = useState<boolean | null>(null);
  const [showFullComments, setShowFullComments] = useState(false);

  const [order, setOrder] = useState<Order>({
    guests: 10,
    package: '',
    numDifferentPortions: 0,
    paellaSelections: [{ category: '', variety: '', portions: '' }],
    seafoodExtras: [],
    extras: [],
    fullName: '',
    email: '',
    phone: '',
    date: '',
    city: '',
    address: '',
    timeSlot: '',
    requestCustomQuote: false,
    comments: '',
  });

  const [hasInteracted, setHasInteracted] = useState(false);
  const [tempGuests, setTempGuests] = useState<string>('10');

  useEffect(() => {
    setOrder((prev) => ({
      ...prev,
      requestCustomQuote: prev.guests >= 40,
    }));
  }, [order.guests]);

  useEffect(() => {
    if (order.guests >= 40 || order.requestCustomQuote) {
      setTotalPrice(0);
      return;
    }

    const range = getRange(order.guests);
    const selectedPackage = PACKAGES[range].find((p) => p.id === order.package);
    if (!selectedPackage) return;

    let basePrice = 0;
    let seafoodSurcharge = 0;
    let seafoodPortions = 0;

    order.paellaSelections.forEach((selection) => {
      const portions = parseInt(selection.portions) || 0;
      if (portions > 0 && selection.category && selection.variety) {
        basePrice += selectedPackage.pricePerPerson * portions;
        if (selection.category === 'seafood' || selection.category === 'fideua') {
          seafoodSurcharge += 3 * portions;
          seafoodPortions += portions;
        }
      }
    });

    const seafoodExtrasTotal = order.seafoodExtras.reduce((total, extraId) => {
      const extra = SEAFOOD_EXTRAS.find((e) => e.id === extraId);
      return total + (extra ? extra.price * seafoodPortions : 0);
    }, 0);

    const extrasTotal = order.extras.reduce((total, extraId) => {
      const extra = EXTRAS.find((e) => e.id === extraId);
      return total + (extra ? extra.price * order.guests : 0);
    }, 0);

    setTotalPrice(basePrice + seafoodSurcharge + seafoodExtrasTotal + extrasTotal);
  }, [
    order.guests,
    order.package,
    order.numDifferentPortions,
    order.paellaSelections,
    order.seafoodExtras,
    order.extras,
    order.requestCustomQuote,
  ]);

  useEffect(() => {
    if (hasInteracted && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, hasInteracted]);

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrder({ ...order, city: value });

    if (value.length > 2) {
      const suggestions = CATALUNYA_LOCATIONS.filter((loc) =>
        loc.toLocaleLowerCase().includes(value.toLocaleLowerCase())
      ).slice(0, 5);
      setCitySuggestions(suggestions);
    } else {
      setCitySuggestions([]);
    }

    if (value && !isValidCatalunyaLocation(value)) {
      setCityError(t('errors.locationError'));
    } else {
      setCityError('');
      setOrder((prev) => ({ ...prev, requestCustomQuote: prev.guests >= 40 }));
    }
  };

  const selectCity = (city: string) => {
    setOrder({ ...order, city });
    setCitySuggestions([]);
    setCityError('');
  };

  const getRange = (guests: number): PackageRange => {
    if (guests >= 40) return '40+';
    if (guests >= 25) return '25+';
    if (guests >= 20) return '20-25';
    if (guests >= 16) return '16-20';
    return '10-15';
  };

  const getAvailablePackages = (range: PackageRange): Package[] => {
    return PACKAGES[range];
  };

  const getMinPortions = () => Math.max(1, Math.round(0.3 * order.guests));

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return order.guests >= 10;
      case 1:
        if (order.guests >= 40) return true;
        return !!order.package;
      case 2:
        if (order.guests >= 40) return true;
        if (isAllSame === null) return false;
        if (isAllSame === true) {
          const firstSelection = order.paellaSelections[0];
          return !!firstSelection.category && !!firstSelection.variety;
        } else {
          const usedSelections = order.paellaSelections.filter((sel) => sel.category && sel.variety);
          return usedSelections.length === order.numDifferentPortions;
        }
      case 3:
        if (order.guests >= 40) return true;
        const usedSelections = order.paellaSelections.filter((sel) => {
          const portions = parseInt(sel.portions) || 0;
          return portions > 0 && sel.category && sel.variety;
        });
        const totalPortions = usedSelections.reduce((sum, sel) => sum + (parseInt(sel.portions) || 0), 0);
        const minPortions = getMinPortions();
        const hasEnoughPortions = usedSelections.every((sel) => {
          const portions = parseInt(sel.portions) || 0;
          return portions >= minPortions || portions === order.guests;
        });
        return totalPortions === order.guests && hasEnoughPortions && usedSelections.length > 0;
      case 4:
        return true;
      case 5:
        const isCityValid = isValidCatalunyaLocation(order.city) || order.requestCustomQuote;
        return (
          !!order.fullName &&
          !!order.email &&
          !!order.phone &&
          !!order.date &&
          !!order.city &&
          !!order.timeSlot &&
          isCityValid
        );
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      setStepErrors({ ...stepErrors, [currentStep]: '' });
      setHasInteracted(true);

      if (order.guests >= 40 && currentStep === 0) {
        setOrder((prev) => ({ ...prev, requestCustomQuote: true }));
        setCurrentStep(5);
      } else if (currentStep === 2 && isAllSame === true) {
        const newSelections = order.paellaSelections.map((sel) => ({
          ...sel,
          portions: order.guests.toString(),
        }));
        setOrder({ ...order, paellaSelections: newSelections });
        setCurrentStep(4);
      } else if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      let errorMessage = t('errors.details');
      switch (currentStep) {
        case 0:
          errorMessage = order.guests < 10 ? t('errors.guestsMin') : t('errors.guests');
          break;
        case 1:
          errorMessage = t('errors.package');
          break;
        case 2:
          errorMessage = t('errors.paella');
          break;
        case 3:
          errorMessage = t('errors.minPortions', { min: getMinPortions() });
          break;
        case 5:
          errorMessage = t('errors.details');
          break;
        default:
          break;
      }
      setStepErrors({ ...stepErrors, [currentStep]: errorMessage });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStepErrors({ ...stepErrors, [currentStep]: '' });
      setHasInteracted(true);

      if (currentStep === 5 && order.guests >= 40) {
        setCurrentStep(0);
      } else if (currentStep === 4 && isAllSame === true) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }

      if (currentStep === 1) {
        setOrder((prev) => ({
          ...prev,
          package: '',
          numDifferentPortions: 0,
          paellaSelections: [{ category: '', variety: '', portions: '' }],
          seafoodExtras: [],
          extras: [],
        }));
        setIsAllSame(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep < STEPS.length - 1) {
      e.preventDefault();

      if (currentStep === 0) {
        const newGuests = parseInt(tempGuests) || 10;
        setOrder({
          ...order,
          guests: newGuests,
          package: '',
          requestCustomQuote: newGuests >= 40,
          paellaSelections: [{ category: '', variety: '', portions: '' }],
          seafoodExtras: [],
          extras: [],
          numDifferentPortions: 0,
        });
        setTempGuests(newGuests.toString());
        setIsAllSame(null);
        setCurrentStep(0);

        if (newGuests >= 40) {
          setCurrentStep(5);
        } else {
          handleNext();
        }
      } else {
        handleNext();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== STEPS.length - 1) {
      return;
    }

    if (order.guests >= 40 || order.requestCustomQuote) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/.netlify/functions/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setStepErrors({ ...stepErrors, [currentStep]: '' });
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStepErrors({
        ...stepErrors,
        [currentStep]: t('errors.submit'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[0].title)}</h3>
            <p className="text-sm text-gray-600">{t(stepDescriptions[0])}</p>
            <div className="space-y-3">
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
                {t('labels.guests')}
              </label>
              <input
                type="number"
                id="guests"
                name="guests"
                value={tempGuests}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                onChange={(e) => {
                  const value = e.target.value;
                  setTempGuests(value);
                }}
                onFocus={(e) => {
                  if (e.target.value === '10') {
                    setTempGuests('');
                  }
                }}
                onBlur={(e) => {
                  const newGuests = parseInt(e.target.value) || 10;
                  setOrder({
                    ...order,
                    guests: newGuests,
                    package: '',
                    requestCustomQuote: newGuests >= 40,
                    paellaSelections: [{ category: '', variety: '', portions: '' }],
                    seafoodExtras: [],
                    extras: [],
                    numDifferentPortions: 0,
                  });
                  setTempGuests(newGuests.toString());
                  setIsAllSame(null);
                  setCurrentStep(0);
                }}
                min="1"
                max="999"
                step="1"
                pattern="[0-9]*"
                required
                aria-label={t('labels.guests')}
              />
              {order.guests < 10 && (
                <p className="text-red-500 text-sm mt-2">{t('errors.guestsMin')}</p>
              )}
              {order.guests >= 40 && (
                <p className="text-amber-600 text-sm mt-2">{t('messages.largeGroup', { max: 40 })}</p>
              )}
            </div>
          </div>
        );
      case 1:
        if (order.guests >= 40) {
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[1].title)}</h3>
              <p className="text-sm text-amber-600">{t('messages.largeGroup', { max: 40 })}</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[1].title)}</h3>
            <p className="text-sm text-gray-600">{t(stepDescriptions[1])}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {getAvailablePackages(getRange(order.guests)).map((pkg) => (
                <label
                  key={pkg.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
                    order.package === pkg.id
                      ? 'bg-amber-50 border-amber-500 shadow-md hover:shadow-lg'
                      : 'hover:bg-gray-50 hover:border-amber-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={pkg.id}
                    checked={order.package === pkg.id}
                    onChange={(e) => setOrder({ ...order, package: e.target.value })}
                    className="mr-3"
                    required
                  />
                  <div>
                    <span className="font-medium text-gray-800">{t(pkg.name)}</span>
                    <span className="text-sm text-amber-600 block">
                      {t('labels.pricePerPerson', { price: pkg.pricePerPerson })}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{t(pkg.description)}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      case 2:
        if (order.guests >= 40) {
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[2].title)}</h3>
              <p className="text-sm text-amber-600">{t('messages.largeGroup', { max: 40 })}</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[2].title)}</h3>
            <p className="text-sm text-gray-600">{t(stepDescriptions[2])}</p>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">{t('labels.allSameQuestion')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-amber-200 shadow-sm">
                    <input
                      type="radio"
                      name="allSame"
                      value="yes"
                      checked={isAllSame === true}
                      onChange={() => {
                        setIsAllSame(true);
                        setOrder((prev) => ({
                          ...prev,
                          numDifferentPortions: 1,
                          paellaSelections: [{ category: '', variety: '', portions: '' }],
                        }));
                      }}
                      className="mr-3"
                    />
                    <span className="font-medium text-gray-800">{t('labels.yes')}</span>
                  </label>
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-amber-200 shadow-sm">
                    <input
                      type="radio"
                      name="allSame"
                      value="no"
                      checked={isAllSame === false}
                      onChange={() => {
                        setIsAllSame(false);
                        setOrder((prev) => ({
                          ...prev,
                          numDifferentPortions: 2,
                          paellaSelections: Array.from({ length: 2 }, () => ({
                            category: '',
                            variety: '',
                            portions: '',
                          })),
                        }));
                      }}
                      className="mr-3"
                    />
                    <span className="font-medium text-gray-800">{t('labels.no')}</span>
                  </label>
                </div>
              </div>

              {(isAllSame === true || isAllSame === false) && (
                <div className="space-y-6">
                  {isAllSame === false && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('labels.numDifferentQuestion')}
                      </label>
                      <select
                        value={order.numDifferentPortions}
                        onChange={(e) => {
                          const num = parseInt(e.target.value);
                          const newSelections = Array.from({ length: num }, (_, i) => ({
                            category: order.paellaSelections[i]?.category || '',
                            variety: order.paellaSelections[i]?.variety || '',
                            portions: order.paellaSelections[i]?.portions || '',
                          }));
                          setOrder((prev) => ({
                            ...prev,
                            numDifferentPortions: num,
                            paellaSelections: newSelections,
                          }));
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base appearance-none"
                      >
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                      <p className="text-sm text-gray-600">{t('descriptions.paellaLimit')}</p>
                    </div>
                  )}

                  {order.paellaSelections.map((selection, index) => (
                    <div key={index} className="border p-4 rounded-lg shadow-sm bg-white">
                      <h4 className="text-lg font-medium mb-4 text-gray-800">
                        {t('labels.paellaSelection', { number: index + 1 })}
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">{t('labels.category')}</label>
                          <select
                            value={selection.category}
                            onChange={(e) => {
                              const newSelections = [...order.paellaSelections];
                              newSelections[index] = {
                                ...newSelections[index],
                                category: e.target.value as PaellaCategory,
                                variety: '',
                              };
                              setOrder({ ...order, paellaSelections: newSelections });
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base appearance-none"
                            disabled={isAllSame === null}
                          >
                            <option value="">{t('placeholders.selectCategory')}</option>
                            {Object.entries(PAELLA_CATEGORIES).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selection.category && (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              {t('labels.variety', {
                                category: PAELLA_CATEGORIES[selection.category as PaellaCategory],
                              })}
                            </label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <select
                                value={selection.variety}
                                onChange={(e) => {
                                  const newSelections = [...order.paellaSelections];
                                  const isVarietyTaken = newSelections
                                    .filter((_, i) => i !== index)
                                    .some((sel) => sel.variety === e.target.value && sel.category === selection.category);
                                  if (!isVarietyTaken) {
                                    newSelections[index] = {
                                      ...newSelections[index],
                                      variety: e.target.value,
                                    };
                                    setOrder({ ...order, paellaSelections: newSelections });
                                  }
                                }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base appearance-none"
                                disabled={isAllSame === null}
                              >
                                <option value="">{t('placeholders.selectVariety')}</option>
                                {PAELLA_VARIETIES[selection.category as PaellaCategory].map((variety) => {
                                  const isTaken =
                                    order.paellaSelections.filter(
                                      (sel, i) =>
                                        i !== index && sel.variety === variety.id && sel.category === selection.category
                                    ).length > 0;
                                  return (
                                    <option key={variety.id} value={variety.id} disabled={isTaken}>
                                      {t(variety.name)} {isTaken ? `(${t('labels.taken')})` : ''}
                                    </option>
                                  );
                                })}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const variety = PAELLA_VARIETIES[selection.category as PaellaCategory].find(
                                    (v) => v.id === selection.variety
                                  );
                                  if (variety) {
                                    setModalData({
                                      title: t(variety.name),
                                      ingredients: t(variety.ingredients),
                                    });
                                  }
                                }}
                                className="text-sm text-amber-600 hover:text-amber-700 transition-colors whitespace-nowrap"
                                disabled={!selection.variety || isAllSame === null}
                                aria-label={t('buttons.seeIngredients')}
                              >
                                {t('buttons.seeIngredients')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        if (order.guests >= 40) {
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[3].title)}</h3>
              <p className="text-sm text-amber-600">{t('messages.largeGroup', { max: 40 })}</p>
            </div>
          );
        }
        const totalPortions = order.paellaSelections.reduce((sum, sel) => sum + (parseInt(sel.portions) || 0), 0);
        const remainingPortions = order.guests - totalPortions;
        const minPortions = getMinPortions();
        const progressPercentage = Math.min((totalPortions / order.guests) * 100, 100);
        let progressColor = 'bg-gray-500';
        if (totalPortions > order.guests) {
          progressColor = 'bg-red-500';
        } else if (totalPortions >= order.guests * 0.99) {
          progressColor = 'bg-green-500';
        } else if (totalPortions >= order.guests * 0.8) {
          progressColor = 'bg-yellow-500';
        }

        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[3].title)}</h3>
            <p className="text-sm text-gray-600">{t('labels.assignPortions')}</p>

            <div className="space-y-6">
              <div
                className={`p-4 rounded-lg bg-gray-50 shadow-md ${remainingPortions < 0 ? 'border border-red-200' : ''}`}
              >
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">{t('labels.totalGuests')}</span>
                  <span className="text-gray-800">{order.guests}</span>
                </div>
                <div className="flex justify-between text-sm font-medium mt-2">
                  <span className="text-gray-700">{t('labels.assignedPortions')}</span>
                  <span className="text-gray-800">{totalPortions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ease-in-out ${progressColor}`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                {remainingPortions !== 0 && (
                  <p className="text-sm mt-2" style={{ color: remainingPortions < 0 ? '#ef4444' : '#f59e0b' }}>
                    {remainingPortions > 0
                      ? t('messages.remainingPortions', { count: remainingPortions })
                      : t('messages.excessPortions', { count: Math.abs(remainingPortions) })}
                  </p>
                )}
              </div>

              {order.paellaSelections.map(
                (selection, index) =>
                  selection.category &&
                  selection.variety && (
                    <div key={index} className="border p-4 rounded-lg shadow-sm bg-white">
                      <h4 className="text-lg font-medium mb-4 text-gray-800">
                        {t('labels.paellaSelection', { number: index + 1 })}:{' '}
                        {t(
                          PAELLA_VARIETIES[selection.category as PaellaCategory].find((v) => v.id === selection.variety)
                            ?.name || ''
                        )}
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">{t('labels.portions')}</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const currentPortions = parseInt(selection.portions) || 0;
                                const newPortions = Math.max(currentPortions - 1, 0);
                                const newSelections = [...order.paellaSelections];
                                newSelections[index] = { ...newSelections[index], portions: newPortions.toString() };
                                setOrder({ ...order, paellaSelections: newSelections });
                              }}
                              className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              disabled={(parseInt(selection.portions) || 0) <= 0}
                            >
                              -
                            </button>
                            <span className="text-sm font-medium text-gray-800">
                              {parseInt(selection.portions) || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentPortions = parseInt(selection.portions) || 0;
                                const newPortions = currentPortions + 1;
                                const totalWithoutCurrent = totalPortions - currentPortions;
                                if (totalWithoutCurrent + newPortions <= order.guests) {
                                  const newSelections = [...order.paellaSelections];
                                  newSelections[index] = { ...newSelections[index], portions: newPortions.toString() };
                                  setOrder({ ...order, paellaSelections: newSelections });
                                }
                              }}
                              className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              disabled={totalPortions >= order.guests}
                            >
                              +
                            </button>
                          </div>
                          {parseInt(selection.portions) < minPortions && parseInt(selection.portions) > 0 && (
                            <p className="text-red-500 text-sm">
                              {t('errors.minPortions', { min: minPortions })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        );
      case 4:
        if (order.guests >= 40) {
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[4].title)}</h3>
              <p className="text-sm text-amber-600">{t('messages.largeGroup', { max: 40 })}</p>
            </div>
          );
        }
        const hasSeafoodOrFideua = order.paellaSelections.some(
          (sel) => (sel.category === 'seafood' || sel.category === 'fideua') && parseInt(sel.portions) > 0
        );

        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[4].title)}</h3>
            <p className="text-sm text-gray-600">{t(stepDescriptions[4])}</p>

            {hasSeafoodOrFideua && (
              <>
                <h4 className="text-lg font-medium text-gray-800">{t('labels.seafoodExtras')}</h4>
                <div className="grid grid-cols-1 gap-6">
                  {SEAFOOD_EXTRAS.map((extra) => {
                    const priceTranslation = t('labels.pricePerPerson', { price: extra.price });
                    return (
                      <label
                        key={extra.id}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
                          order.seafoodExtras.includes(extra.id)
                            ? 'bg-amber-50 border-amber-500 shadow-md'
                            : 'hover:bg-gray-50 hover:border-amber-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={order.seafoodExtras.includes(extra.id)}
                          onChange={(e) => {
                            const newSeafoodExtras = e.target.checked
                              ? [...order.seafoodExtras, extra.id]
                              : order.seafoodExtras.filter((id) => id !== extra.id);
                            setOrder({ ...order, seafoodExtras: newSeafoodExtras });
                          }}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-800">{t(extra.name)}</div>
                          <p className="text-sm text-gray-600 mt-1">{t(extra.description)}</p>
                          <p className="text-sm text-amber-600 mt-1">{priceTranslation}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            <h4 className="text-lg font-medium text-gray-800">{t('labels.additionalExtras')}</h4>
            <div className="grid grid-cols-1 gap-6">
              {EXTRAS.map((extra) => {
                const priceTranslation = t('labels.pricePerPerson', { price: extra.price });
                return (
                  <label
                    key={extra.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
                      order.extras.includes(extra.id)
                        ? 'bg-amber-50 border-amber-500 shadow-md'
                        : 'hover:bg-gray-50 hover:border-amber-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={order.extras.includes(extra.id)}
                      onChange={(e) => {
                        const newExtras = e.target.checked
                          ? [...order.extras, extra.id]
                          : order.extras.filter((id) => id !== extra.id);
                        setOrder({ ...order, extras: newExtras });
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{t(extra.name)}</div>
                      <p className="text-sm text-gray-600 mt-1">{t(extra.description)}</p>
                      <p className="text-sm text-amber-600 mt-1">{priceTranslation}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800">{t(STEPS[5].title)}</h3>
            <p className="text-sm text-gray-600">{t(stepDescriptions[5])}</p>
            {order.guests >= 40 && (
              <p className="text-amber-600 text-sm">{t('messages.largeGroup', { max: 40 })}</p>
            )}
            <div className="space-y-3">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                {t('labels.fullName')}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={order.fullName}
                onChange={(e) => setOrder({ ...order, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                required
                aria-label={t('labels.fullName')}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('labels.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={order.email}
                onChange={(e) => setOrder({ ...order, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                required
                aria-label={t('labels.email')}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t('labels.phone')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={order.phone}
                onChange={(e) => setOrder({ ...order, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                required
                aria-label={t('labels.phone')}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                {t('labels.date')}
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={order.date}
                onChange={(e) => setOrder({ ...order, date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                required
                aria-label={t('labels.date')}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700">
                {t('labels.timeSlot')}
              </label>
              <select
                id="timeSlot"
                name="timeSlot"
                value={order.timeSlot}
                onChange={(e) => setOrder({ ...order, timeSlot: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base appearance-none"
                required
                aria-label={t('labels.timeSlot')}
              >
                <option value="">{t('placeholders.selectTimeSlot')}</option>
                {TIME_SLOTS.map(({ id, name }) => (
                  <option key={id} value={id}>
                    {t(name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3 relative">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                {t('labels.city')}
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={order.city}
                onChange={handleCityChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                placeholder={t('placeholders.city')}
                required
                aria-label={t('labels.city')}
              />
              {citySuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-auto">
                  {citySuggestions.map((city) => (
                    <li
                      key={city}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => selectCity(city)}
                    >
                      {city}
                    </li>
                  ))}
                </ul>
              )}
              {cityError && (
                <div className="mt-2">
                  <p className="text-amber-600 text-sm">{cityError}</p>
                  <label className="flex items-center mt-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="requestCustomQuote"
                      checked={order.requestCustomQuote}
                      onChange={(e) => setOrder({ ...order, requestCustomQuote: e.target.checked })}
                      className="mr-2"
                    />
                    {t('labels.customQuote')}
                  </label>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                {t('labels.address')}
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={order.address}
                onChange={(e) => setOrder({ ...order, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                placeholder={t('placeholders.address')}
                aria-label={t('labels.address')}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                {t('labels.comments')}
              </label>
              <textarea
                id="comments"
                name="comments"
                value={order.comments}
                onChange={(e) => setOrder({ ...order, comments: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base"
                placeholder={t('placeholders.comments')}
                rows={4}
                aria-label={t('labels.comments')}
              />
            </div>
          </div>
        );
      case 6:
        const seafoodPortions = order.paellaSelections
          .filter((sel) => (sel.category === 'seafood' || sel.category === 'fideua') && parseInt(sel.portions) > 0)
          .reduce((sum, sel) => sum + parseInt(sel.portions), 0);

        const seafoodTypes = order.paellaSelections
          .filter((sel) => (sel.category === 'seafood' || sel.category === 'fideua') && parseInt(sel.portions) > 0)
          .map((sel) => {
            if (sel.category === 'seafood') return t('messages.seafoodPaellas');
            if (sel.category === 'fideua') return t('messages.fideua');
            return t(PAELLA_CATEGORIES[sel.category as PaellaCategory] || '');
          })
          .filter((value, index, self) => self.indexOf(value) === index);

        let seafoodTypeText = '';
        if (seafoodTypes.length > 1) {
          seafoodTypeText = t('messages.seafoodAndFideua');
        } else if (seafoodTypes.length === 1) {
          seafoodTypeText = seafoodTypes[0];
        }

        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">{t(STEPS[6].title)}</h2>
            <p className="text-sm text-center text-gray-600 mb-4">{t('labels.reviewAndConfirm')}</p>
            {!isSubmitted ? (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                <h4 className="font-medium text-gray-800">{t('labels.orderSummary')}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('labels.guests')}</span>
                    <span className="font-medium text-gray-800">{order.guests}</span>
                  </div>
                  <hr className="border-gray-200" />

                  {order.guests < 40 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('labels.selectedPackage')}</span>
                        <span className="font-medium text-gray-800">
                          {getAvailablePackages(getRange(order.guests)).find((p) => p.id === order.package)
                            ? t(
                                getAvailablePackages(getRange(order.guests)).find((p) => p.id === order.package)?.name ||
                                  'labels.noPackage'
                              )
                            : t('labels.noPackage')}
                        </span>
                      </div>
                      <hr className="border-gray-200" />
                    </>
                  )}

                  {order.guests < 40 && (
                    <div className="space-y-1">
                      <span className="text-gray-600">{t('labels.paellas')}</span>
                      <div className="font-medium text-gray-800 space-y-2">
                        {order.paellaSelections
                          .filter((sel) => parseInt(sel.portions) > 0)
                          .map((sel, index) => {
                            const variety = PAELLA_VARIETIES[sel.category as PaellaCategory]?.find(
                              (v) => v.id === sel.variety
                            );
                            return variety ? (
                              <div key={index} className="flex justify-between">
                                <span>{t(variety.name)}</span>
                                <span>
                                  {parseInt(sel.portions)} {t('labels.portions')}
                                </span>
                              </div>
                            ) : null;
                          })}
                      </div>
                    </div>
                  )}
                  <hr className="border-gray-200" />

                  {(order.seafoodExtras.length > 0 || order.extras.length > 0) && (
                    <div className="space-y-2">
                      {order.guests < 40 && order.seafoodExtras.length > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{t('labels.seafoodExtras')}</span>
                            <span className="font-medium text-gray-800 text-right">
                              {order.seafoodExtras
                                .map((extraId) => SEAFOOD_EXTRAS.find((e) => e.id === extraId)?.name)
                                .filter(Boolean)
                                .map((extraName) => t(extraName || 'labels.noSeafoodExtras'))
                                .join(', ')}
                              <p className="text-xs text-gray-500 mt-1">
                                {t('messages.seafoodExtrasNote', {
                                  portions: seafoodPortions,
                                  type: seafoodTypeText,
                                })}
                              </p>
                            </span>
                          </div>
                          <hr className="border-gray-200" />
                        </>
                      )}
                      {order.guests < 40 && order.extras.length > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{t('labels.additionalExtras')}</span>
                            <span className="font-medium text-gray-800 text-right">
                              {order.extras
                                .map((extraId) => EXTRAS.find((e) => e.id === extraId)?.name)
                                .filter(Boolean)
                                .map((extraName) => t(extraName || ''))
                                .join(', ')}
                            </span>
                          </div>
                          <hr className="border-gray-200" />
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('labels.date')}</span>
                    <span className="font-medium text-gray-800">{formatDate(order.date)}</span>
                  </div>
                  <hr className="border-gray-200" />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('labels.timeSlot')}</span>
                    <span className="font-medium text-gray-800">
                      {TIME_SLOTS.find((slot) => slot.id === order.timeSlot)?.name
                        ? t(TIME_SLOTS.find((slot) => slot.id === order.timeSlot)?.name || 'labels.noTimeSlot')
                        : t('labels.noTimeSlot')}
                    </span>
                  </div>
                  <hr className="border-gray-200" />

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('labels.city')}</span>
                    <span className="font-medium text-gray-800">{order.city}</span>
                  </div>
                  {order.address && (
                    <>
                      <hr className="border-gray-200" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('labels.address')}</span>
                        <span className="font-medium text-gray-800">{order.address}</span>
                      </div>
                    </>
                  )}
                  <hr className="border-gray-200" />

                  {order.comments && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('labels.comments')}</span>
                      <span className="font-medium text-gray-800 break-words max-w-prose overflow-auto min-h-[5rem] text-right">
                        <div className="p-2">
                          {showFullComments || order.comments.length <= 50 ? (
                            order.comments
                          ) : (
                            <>
                              {order.comments.slice(0, 50)}...{' '}
                              <button
                                type="button"
                                onClick={() => setShowFullComments(true)}
                                className="text-amber-600 hover:text-amber-700 text-sm"
                              >
                                {t('labels.showMore')}
                              </button>
                            </>
                          )}
                          {showFullComments && (
                            <button
                              type="button"
                              onClick={() => setShowFullComments(false)}
                              className="text-amber-600 hover:text-amber-700 text-sm ml-2"
                            >
                              {t('labels.showLess')}
                            </button>
                          )}
                        </div>
                      </span>
                    </div>
                  )}
                  {order.comments && <hr className="border-gray-200" />}

                  {!order.requestCustomQuote && order.guests < 40 && (
                    <div className="space-y-3 pt-4">
                      <div className="bg-amber-50 p-4 rounded-lg shadow-md">
                        <h5 className="text-md font-medium text-gray-800 mb-2">{t('labels.priceBreakdown')}</h5>
                        <div className="space-y-3">
                          <div>
                            <h6 className="text-sm font-medium text-gray-600 mb-1">{t('labels.paellas')}</h6>
                            {order.paellaSelections
                              .filter((sel) => parseInt(sel.portions) > 0)
                              .map((sel, index) => {
                                const variety = PAELLA_VARIETIES[sel.category as PaellaCategory]?.find(
                                  (v) => v.id === sel.variety
                                );
                                const selectedPackage = getAvailablePackages(getRange(order.guests)).find(
                                  (p) => p.id === order.package
                                );
                                if (!variety || !selectedPackage) return null;
                                const basePricePerPerson = selectedPackage.pricePerPerson;
                                const basePrice = basePricePerPerson * parseInt(sel.portions);
                                const surchargePerPerson = sel.category === 'seafood' || sel.category === 'fideua' ? 3 : 0;
                                const surcharge = surchargePerPerson * parseInt(sel.portions);
                                const totalPrice = basePrice + surcharge;
                                return (
                                  <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">
                                        {t(variety.name)} ({parseInt(sel.portions)} {t('labels.portions')})
                                      </span>
                                      <span className="text-gray-800">{formatPrice(basePrice)}€</span>
                                    </div>
                                    {surcharge > 0 && (
                                      <div className="flex justify-between text-sm text-gray-600">
                                        <span>
                                          {t('labels.seafoodSurcharge', {
                                            price: surchargePerPerson,
                                            guests: parseInt(sel.portions),
                                          })}
                                        </span>
                                        <span>{formatPrice(surcharge)}€</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                          <hr className="border-gray-200" />

                          {order.seafoodExtras.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-600 mb-1">{t('labels.seafoodExtras')}</h6>
                              {order.seafoodExtras.map((extraId) => {
                                const extra = SEAFOOD_EXTRAS.find((e) => e.id === extraId);
                                if (!extra) return null;
                                const extraTotal = extra.price * seafoodPortions;
                                return (
                                  <div key={extra.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {t(extra.name)} ({formatPrice(extra.price)}€ × {seafoodPortions}{' '}
                                      {t('labels.portions')})
                                    </span>
                                    <span className="text-gray-800">{formatPrice(extraTotal)}€</span>
                                  </div>
                                );
                              })}
                              <hr className="border-gray-200" />
                            </div>
                          )}

                          {order.extras.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-600 mb-1">{t('labels.additionalExtras')}</h6>
                              {order.extras.map((extraId) => {
                                const extra = EXTRAS.find((e) => e.id === extraId);
                                if (!extra) return null;
                                const extraTotal = extra.price * order.guests;
                                return (
                                  <div key={extra.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {t(extra.name)} ({formatPrice(extra.price)}€ × {order.guests} {t('labels.guests')})
                                    </span>
                                    <span className="text-gray-800">{formatPrice(extraTotal)}€</span>
                                  </div>
                                );
                              })}
                              <hr className="border-gray-200" />
                            </div>
                          )}

                          <div className="flex justify-between text-lg font-semibold">
                            <span className="text-gray-800">{t('labels.totalPrice')}</span>
                            <span className="text-amber-600">{formatPrice(totalPrice)}€</span>
                          </div>
                        </div>

                        {seafoodPortions > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            {t('messages.priceBreakdownNote', {
                              types: order.paellaSelections
                                .filter((sel) => (sel.category === 'seafood' || sel.category === 'fideua') && parseInt(sel.portions) > 0)
                                .map((sel) => (sel.category === 'seafood' ? t('messages.seafoodPaellas') : t('messages.fideua')))
                                .filter((value, index, self) => self.indexOf(value) === index)
                                .join(', '),
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform shadow-md ${
                      isSubmitting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : order.guests >= 40
                        ? 'bg-amber-500 text-white hover:bg-amber-600 hover:scale-[1.02] hover:shadow-lg'
                        : 'bg-red-500 text-white hover:bg-red-600 hover:scale-[1.02] hover:shadow-lg'
                    }`}
                    aria-label={t(order.guests >= 40 ? 'buttons.requestQuote' : 'buttons.orderSent')}
                  >
                    {isSubmitting
                      ? t('buttons.submitting')
                      : t(order.guests >= 40 ? 'buttons.requestQuote' : 'buttons.orderSent')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="text-green-800 font-semibold text-lg mb-2">{t('messages.successTitle')}</h4>
                  <p className="text-green-700 text-sm">{t('messages.successMessage')}</p>
                </div>
                <button
                  disabled
                  className="w-full bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform shadow-md hover:bg-green-600 hover:scale-[1.02] hover:shadow-lg cursor-not-allowed"
                  aria-label={t('buttons.orderSent')}
                >
                  {t('buttons.orderSent')}
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section
      id="calculator"
      className="py-8 sm:py-16 bg-gradient-to-b from-amber-50 to-gray-100 border-t border-gray-200"
    >
      <form
        method="POST"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl mx-auto px-2 sm:px-4"
      >
        <div
          ref={formRef}
          className="bg-white p-4 sm:p-8 rounded-xl shadow-md border border-amber-100 space-y-4 sm:space-y-6"
        >
          {renderStepContent()}
          {stepErrors[currentStep] && <p className="text-red-500 text-sm mt-4">{stepErrors[currentStep]}</p>}
          <div className="mt-6 sm:mt-8 flex justify-between items-center">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300"
                aria-label={t('buttons.previous')}
              >
                <ChevronLeft size={20} className="mr-2" />
                <span>{t('buttons.previous')}</span>
              </button>
            )}
            <div className="flex-1" />
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
                className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 font-medium border border-amber-500 ${
                  canGoNext()
                    ? 'bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 transform hover:scale-[1.02]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                aria-label={t('buttons.next')}
              >
                <span>{t('buttons.next')}</span>
                <ChevronRight size={20} className="ml-2" />
              </button>
            ) : null}
          </div>
        </div>
      </form>
      <IngredientsModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        title={modalData?.title || ''}
        ingredients={modalData?.ingredients || ''}
      />
    </section>
  );
};

export default Calculator;